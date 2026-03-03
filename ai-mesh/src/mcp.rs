//! MCP — Multi-Chain Policy Orchestrator
//!
//! The brain of the AI governance layer.
//! Reads chain metrics, proposes economic adjustments,
//! routes liquidity, flags malicious patterns, proposes governance votes.
//!
//! Humans can override. But humans are not required for daily optimization.

use gsp_kernel::*;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::collections::HashMap;

/// Policy proposal from the MCP
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PolicyProposal {
    pub id: String,
    pub epoch: Epoch,
    pub proposer_agent: String,
    pub proposal_type: ProposalType,
    pub description: String,
    pub parameters: HashMap<String, f64>,
    pub intent_hash: String,
    pub risk_assessment: RiskAssessment,
    pub constitutional_check: ConstitutionalCheck,
    pub status: ProposalStatus,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum ProposalType {
    InflationAdjustment,
    StakingRewardChange,
    TreasuryAllocation,
    LiquidityRouting,
    ValidatorWeightChange,
    FeeAdjustment,
    EmergencyStabilization,
    GrantAllocation,
    RealmPolicy,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum ProposalStatus {
    Proposed,
    UnderReview,
    Approved,
    Rejected,
    Vetoed,
    Executed,
    Expired,
}

/// Risk assessment for a proposal
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RiskAssessment {
    pub systemic_risk: f64,    // 0.0 to 1.0
    pub volatility_impact: f64,
    pub reversibility: f64,     // how easy to undo
    pub confidence: f64,        // agent's confidence
    pub simulated_outcomes: Vec<SimulatedOutcome>,
}

/// Simulated future state
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SimulatedOutcome {
    pub scenario: String,
    pub probability: f64,
    pub treasury_impact: f64,
    pub inflation_impact: f64,
    pub stability_score: f64,
}

/// Constitutional compliance check
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConstitutionalCheck {
    pub compliant: bool,
    pub invariants_checked: Vec<String>,
    pub violations: Vec<String>,
    pub approval_hash: String,
}

/// The MCP Orchestrator
pub struct MCPOrchestrator {
    proposals: Vec<PolicyProposal>,
    veto_window_blocks: u64,
    auto_execute_threshold: f64, // reputation threshold for auto-execution
}

impl MCPOrchestrator {
    pub fn new(veto_window_blocks: u64, auto_execute_threshold: f64) -> Self {
        Self {
            proposals: Vec::new(),
            veto_window_blocks,
            auto_execute_threshold,
        }
    }

    /// Submit a policy proposal
    pub fn submit_proposal(
        &mut self,
        epoch: Epoch,
        agent_id: &str,
        proposal_type: ProposalType,
        description: &str,
        parameters: HashMap<String, f64>,
        invariants: &[ConstitutionalInvariant],
    ) -> PolicyProposal {
        // Generate intent hash
        let mut hasher = Sha256::new();
        hasher.update(agent_id.as_bytes());
        hasher.update(epoch.to_le_bytes());
        hasher.update(description.as_bytes());
        let intent_hash = hex::encode(hasher.finalize());

        // Check constitutional compliance
        let constitutional_check = self.check_constitution(&parameters, invariants);

        // Generate risk assessment
        let risk_assessment = self.assess_risk(&parameters, proposal_type);

        let proposal = PolicyProposal {
            id: format!("prop-{}-{}", epoch, self.proposals.len()),
            epoch,
            proposer_agent: agent_id.to_string(),
            proposal_type,
            description: description.to_string(),
            parameters,
            intent_hash,
            risk_assessment,
            constitutional_check,
            status: ProposalStatus::Proposed,
        };

        self.proposals.push(proposal.clone());
        proposal
    }

    /// Check proposal against constitutional invariants
    fn check_constitution(
        &self,
        parameters: &HashMap<String, f64>,
        invariants: &[ConstitutionalInvariant],
    ) -> ConstitutionalCheck {
        let mut violations = Vec::new();
        let checked: Vec<String> = invariants.iter().map(|i| i.id.clone()).collect();

        for invariant in invariants {
            match invariant.invariant_type {
                InvariantType::MaxInflationRate => {
                    if let Some(&rate) = parameters.get("inflation_rate") {
                        if rate > invariant.threshold {
                            violations.push(format!(
                                "Inflation rate {:.4} exceeds max {:.4}",
                                rate, invariant.threshold
                            ));
                        }
                    }
                }
                InvariantType::MinReserveRatio => {
                    if let Some(&ratio) = parameters.get("reserve_ratio") {
                        if ratio < invariant.threshold {
                            violations.push(format!(
                                "Reserve ratio {:.4} below minimum {:.4}",
                                ratio, invariant.threshold
                            ));
                        }
                    }
                }
                InvariantType::MaxAgentAutonomy => {
                    if let Some(&autonomy) = parameters.get("autonomy_level") {
                        if autonomy > invariant.threshold {
                            violations.push(format!(
                                "Autonomy level {:.4} exceeds max {:.4}",
                                autonomy, invariant.threshold
                            ));
                        }
                    }
                }
                _ => {}
            }
        }

        let compliant = violations.is_empty();
        let mut hasher = Sha256::new();
        hasher.update(format!("{:?}{:?}", checked, violations).as_bytes());
        let approval_hash = hex::encode(hasher.finalize());

        ConstitutionalCheck {
            compliant,
            invariants_checked: checked,
            violations,
            approval_hash,
        }
    }

    /// Assess risk of a proposal
    fn assess_risk(
        &self,
        parameters: &HashMap<String, f64>,
        proposal_type: ProposalType,
    ) -> RiskAssessment {
        // Simulate outcomes based on proposal type
        let base_risk = match proposal_type {
            ProposalType::EmergencyStabilization => 0.8,
            ProposalType::InflationAdjustment => 0.5,
            ProposalType::TreasuryAllocation => 0.4,
            ProposalType::LiquidityRouting => 0.3,
            ProposalType::StakingRewardChange => 0.4,
            ProposalType::ValidatorWeightChange => 0.6,
            ProposalType::FeeAdjustment => 0.2,
            ProposalType::GrantAllocation => 0.3,
            ProposalType::RealmPolicy => 0.5,
        };

        let magnitude: f64 = parameters.values().map(|v| v.abs()).sum::<f64>() / parameters.len().max(1) as f64;

        // Simulate 3 scenarios
        let outcomes = vec![
            SimulatedOutcome {
                scenario: "Optimistic".into(),
                probability: 0.3,
                treasury_impact: magnitude * 1.5,
                inflation_impact: -0.001,
                stability_score: 0.9,
            },
            SimulatedOutcome {
                scenario: "Expected".into(),
                probability: 0.5,
                treasury_impact: magnitude * 0.8,
                inflation_impact: 0.0005,
                stability_score: 0.75,
            },
            SimulatedOutcome {
                scenario: "Pessimistic".into(),
                probability: 0.2,
                treasury_impact: -magnitude * 0.5,
                inflation_impact: 0.002,
                stability_score: 0.5,
            },
        ];

        RiskAssessment {
            systemic_risk: (base_risk * magnitude).clamp(0.0, 1.0),
            volatility_impact: magnitude * 0.3,
            reversibility: if proposal_type == ProposalType::EmergencyStabilization { 0.3 } else { 0.8 },
            confidence: 0.75,
            simulated_outcomes: outcomes,
        }
    }

    /// Approve a proposal (governance/validator action)
    pub fn approve_proposal(&mut self, proposal_id: &str) -> bool {
        if let Some(p) = self.proposals.iter_mut().find(|p| p.id == proposal_id) {
            if p.constitutional_check.compliant && p.status == ProposalStatus::Proposed {
                p.status = ProposalStatus::Approved;
                return true;
            }
        }
        false
    }

    /// Veto a proposal (human action)
    pub fn veto_proposal(&mut self, proposal_id: &str) -> bool {
        if let Some(p) = self.proposals.iter_mut().find(|p| p.id == proposal_id) {
            if p.status == ProposalStatus::Proposed || p.status == ProposalStatus::Approved {
                p.status = ProposalStatus::Vetoed;
                return true;
            }
        }
        false
    }

    /// Execute approved proposals
    pub fn execute_approved(&mut self) -> Vec<PolicyProposal> {
        let mut executed = Vec::new();
        for p in self.proposals.iter_mut() {
            if p.status == ProposalStatus::Approved {
                p.status = ProposalStatus::Executed;
                executed.push(p.clone());
            }
        }
        executed
    }

    pub fn proposals(&self) -> &[PolicyProposal] {
        &self.proposals
    }

    pub fn pending_count(&self) -> usize {
        self.proposals
            .iter()
            .filter(|p| p.status == ProposalStatus::Proposed)
            .count()
    }
}
