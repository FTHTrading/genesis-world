//! Agent Identity — Chain-native identity system
//!
//! Every agent has a cryptographic identity anchored at genesis:
//! - Birth certificate NFT
//! - Personality hash
//! - Evolution log
//! - Reputation score
//! - Performance metrics

use gsp_kernel::{AgentBirthCertificate, Epoch, GeneticVector};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};

/// Full agent identity with lifecycle tracking
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentIdentity {
    /// Birth certificate from genesis
    pub birth_certificate: AgentBirthCertificate,
    /// Current genetic vector (may have evolved)
    pub current_dna: GeneticVector,
    /// Generation count (mutations applied)
    pub generation: u32,
    /// Performance history per epoch
    pub performance_log: Vec<EpochPerformance>,
    /// Decision history
    pub decision_log: Vec<DecisionRecord>,
    /// Current reputation score
    pub reputation_score: f64,
    /// Status
    pub status: AgentStatus,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum AgentStatus {
    Active,
    Suspended,
    Slashed,
    Retired,
}

/// Performance metrics for a single epoch
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EpochPerformance {
    pub epoch: Epoch,
    pub decisions_made: u32,
    pub decisions_approved: u32,
    pub decisions_vetoed: u32,
    pub treasury_impact: f64, // positive = gain, negative = loss
    pub risk_delta: f64,
    pub constitutional_violations: u32,
    pub uptime: f64, // 0.0 to 1.0
}

/// Record of a single decision
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DecisionRecord {
    pub epoch: Epoch,
    pub block_height: u64,
    pub decision_type: DecisionType,
    pub description: String,
    pub intent_hash: String,
    pub outcome_hash: Option<String>,
    pub approved: bool,
    pub impact: f64,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub enum DecisionType {
    TreasuryAllocation,
    InflationAdjustment,
    StakeRebalance,
    GovernanceVote,
    LiquidityRoute,
    RiskMitigation,
    EntropyResponse,
    GrantProposal,
}

impl AgentIdentity {
    /// Create identity from birth certificate
    pub fn from_birth(cert: AgentBirthCertificate) -> Self {
        let dna = cert.genetic_vector.clone();
        Self {
            birth_certificate: cert,
            current_dna: dna,
            generation: 0,
            performance_log: Vec::new(),
            decision_log: Vec::new(),
            reputation_score: 0.5, // neutral start
            status: AgentStatus::Active,
        }
    }

    /// Record a decision
    pub fn record_decision(&mut self, decision: DecisionRecord) {
        self.decision_log.push(decision);
    }

    /// Record epoch performance and update reputation
    pub fn record_epoch_performance(&mut self, perf: EpochPerformance) {
        // Update reputation based on performance
        let approval_rate = if perf.decisions_made > 0 {
            perf.decisions_approved as f64 / perf.decisions_made as f64
        } else {
            0.5
        };

        let violation_penalty = perf.constitutional_violations as f64 * 0.1;
        let uptime_bonus = (perf.uptime - 0.9).max(0.0) * 0.5;
        let impact_factor = (perf.treasury_impact / 1000.0).clamp(-0.1, 0.1);

        let reputation_delta = (approval_rate * 0.3 + uptime_bonus + impact_factor - violation_penalty)
            .clamp(-0.2, 0.1);

        self.reputation_score = (self.reputation_score + reputation_delta).clamp(0.0, 1.0);

        // Slash if too many violations
        if perf.constitutional_violations >= 3 {
            self.status = AgentStatus::Slashed;
        }

        self.performance_log.push(perf);
    }

    /// Get the agent's lineage name
    pub fn lineage(&self) -> &str {
        self.birth_certificate.rail_type.agent_lineage()
    }

    /// Get average performance across all epochs
    pub fn average_performance(&self) -> Option<f64> {
        if self.performance_log.is_empty() {
            return None;
        }
        let total: f64 = self
            .performance_log
            .iter()
            .map(|p| p.treasury_impact)
            .sum();
        Some(total / self.performance_log.len() as f64)
    }

    /// Get total decisions made
    pub fn total_decisions(&self) -> u32 {
        self.decision_log.len() as u32
    }

    /// Generate a personality hash from current state
    pub fn personality_hash(&self) -> String {
        let mut hasher = Sha256::new();
        hasher.update(self.birth_certificate.agent_id.as_bytes());
        hasher.update(self.generation.to_le_bytes());
        let dna_bytes = serde_json::to_vec(&self.current_dna).unwrap_or_default();
        hasher.update(&dna_bytes);
        hasher.update(self.reputation_score.to_le_bytes());
        hex::encode(hasher.finalize())
    }
}
