//! Governance AI — Proposal scoring, constitutional compliance, veto logic
//!
//! The governance AI layer processes:
//! - Policy proposals from MCP agents
//! - Constitutional compliance checks
//! - Risk scoring
//! - Veto window management
//! - Execution scheduling

use gsp_kernel::*;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};

/// Governance decision record
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GovernanceDecision {
    pub proposal_id: String,
    pub decision: Decision,
    pub scoring: GovernanceScore,
    pub veto_deadline_block: BlockHeight,
    pub vetoed_by: Option<String>,
    pub decision_hash: String,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum Decision {
    Approved,
    Rejected,
    PendingVeto,
    Vetoed,
    AutoExecuted,
}

/// Multi-dimensional governance scoring
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GovernanceScore {
    pub constitutional_alignment: f64,
    pub risk_score: f64,
    pub economic_impact: f64,
    pub precedent_score: f64,
    pub agent_reputation: f64,
    pub composite: f64,
}

/// The Governance AI engine
pub struct GovernanceAI {
    decisions: Vec<GovernanceDecision>,
    veto_window_blocks: u64,
    auto_execute_threshold: f64,
    min_score_for_approval: f64,
}

impl GovernanceAI {
    pub fn new(veto_window_blocks: u64, auto_execute_threshold: f64) -> Self {
        Self {
            decisions: Vec::new(),
            veto_window_blocks,
            auto_execute_threshold,
            min_score_for_approval: 0.6,
        }
    }

    /// Score and decide on a proposal
    pub fn evaluate_proposal(
        &mut self,
        proposal_id: &str,
        constitutional_compliant: bool,
        systemic_risk: f64,
        treasury_impact: f64,
        has_precedent: bool,
        agent_reputation: f64,
        current_block: BlockHeight,
    ) -> GovernanceDecision {
        let constitutional_alignment = if constitutional_compliant { 1.0 } else { 0.0 };
        let risk_score = 1.0 - systemic_risk;
        let economic_impact = (treasury_impact + 1.0).clamp(0.0, 2.0) / 2.0;
        let precedent_score = if has_precedent { 0.8 } else { 0.5 };

        let composite = constitutional_alignment * 0.30
            + risk_score * 0.25
            + economic_impact * 0.20
            + precedent_score * 0.10
            + agent_reputation * 0.15;

        let scoring = GovernanceScore {
            constitutional_alignment,
            risk_score,
            economic_impact,
            precedent_score,
            agent_reputation,
            composite,
        };

        let decision = if !constitutional_compliant {
            Decision::Rejected
        } else if composite >= self.auto_execute_threshold {
            Decision::PendingVeto // high-confidence, pending human veto window
        } else if composite >= self.min_score_for_approval {
            Decision::Approved
        } else {
            Decision::Rejected
        };

        let mut hasher = Sha256::new();
        hasher.update(proposal_id.as_bytes());
        hasher.update(format!("{:?}", decision).as_bytes());
        hasher.update(composite.to_le_bytes());
        let decision_hash = hex::encode(hasher.finalize());

        let gov_decision = GovernanceDecision {
            proposal_id: proposal_id.to_string(),
            decision,
            scoring,
            veto_deadline_block: current_block + self.veto_window_blocks,
            vetoed_by: None,
            decision_hash,
        };

        self.decisions.push(gov_decision.clone());
        gov_decision
    }

    /// Human veto of a pending decision
    pub fn veto(&mut self, proposal_id: &str, vetoer: &str) -> bool {
        if let Some(d) = self.decisions.iter_mut().find(|d| d.proposal_id == proposal_id) {
            if d.decision == Decision::PendingVeto || d.decision == Decision::Approved {
                d.decision = Decision::Vetoed;
                d.vetoed_by = Some(vetoer.to_string());
                return true;
            }
        }
        false
    }

    /// Check if veto window has passed and auto-execute
    pub fn check_auto_execute(&mut self, current_block: BlockHeight) -> Vec<GovernanceDecision> {
        let mut executed = Vec::new();
        for d in self.decisions.iter_mut() {
            if d.decision == Decision::PendingVeto && current_block >= d.veto_deadline_block {
                d.decision = Decision::AutoExecuted;
                executed.push(d.clone());
            }
        }
        executed
    }

    pub fn decisions(&self) -> &[GovernanceDecision] {
        &self.decisions
    }

    pub fn approval_rate(&self) -> f64 {
        let total = self.decisions.len() as f64;
        if total == 0.0 {
            return 0.0;
        }
        let approved = self
            .decisions
            .iter()
            .filter(|d| {
                d.decision == Decision::Approved
                    || d.decision == Decision::AutoExecuted
                    || d.decision == Decision::PendingVeto
            })
            .count() as f64;
        approved / total
    }
}
