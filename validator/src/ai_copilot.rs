//! AI Validator Co-Pilot
//!
//! Each validator can run a co-pilot that:
//! - Predicts slashing risks
//! - Optimizes uptime
//! - Auto-rebalances stake
//! - Detects MEV attacks
//! - Simulates adversarial conditions
//!
//! Co-pilots must submit decision hashes BEFORE execution.
//! Validators vote on AI actions.

use gsp_kernel::{Epoch, ValidatorId, ValidatorWeight};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};

/// Co-pilot recommendation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CoPilotRecommendation {
    pub validator_id: ValidatorId,
    pub epoch: Epoch,
    pub recommendation_type: RecommendationType,
    pub description: String,
    pub confidence: f64,
    pub intent_hash: String,
    pub risk_score: f64,
    pub status: RecommendationStatus,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub enum RecommendationType {
    StakeRebalance,
    UptimeOptimization,
    SlashingDefense,
    MEVDetection,
    AdversarialSimulation,
    SubnetJoin,
    SubnetLeave,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum RecommendationStatus {
    Proposed,
    Approved,
    Rejected,
    Executed,
}

/// Performance metrics for a validator
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ValidatorMetrics {
    pub validator_id: ValidatorId,
    pub uptime: f64,
    pub blocks_proposed: u64,
    pub blocks_missed: u64,
    pub slashing_events: u32,
    pub mev_detected: u32,
    pub copilot_accuracy: f64,
    pub performance_score: f64,
}

/// The Validator Co-Pilot
pub struct ValidatorCoPilot {
    validator_id: ValidatorId,
    recommendations: Vec<CoPilotRecommendation>,
    metrics: ValidatorMetrics,
}

impl ValidatorCoPilot {
    pub fn new(validator_id: ValidatorId) -> Self {
        Self {
            metrics: ValidatorMetrics {
                validator_id: validator_id.clone(),
                uptime: 1.0,
                blocks_proposed: 0,
                blocks_missed: 0,
                slashing_events: 0,
                mev_detected: 0,
                copilot_accuracy: 0.5,
                performance_score: 0.5,
            },
            validator_id,
            recommendations: Vec::new(),
        }
    }

    /// Generate a recommendation
    pub fn recommend(
        &mut self,
        epoch: Epoch,
        rec_type: RecommendationType,
        description: &str,
        confidence: f64,
        risk_score: f64,
    ) -> CoPilotRecommendation {
        let mut hasher = Sha256::new();
        hasher.update(self.validator_id.0.as_bytes());
        hasher.update(epoch.to_le_bytes());
        hasher.update(description.as_bytes());
        let intent_hash = hex::encode(hasher.finalize());

        let rec = CoPilotRecommendation {
            validator_id: self.validator_id.clone(),
            epoch,
            recommendation_type: rec_type,
            description: description.to_string(),
            confidence,
            intent_hash,
            risk_score,
            status: RecommendationStatus::Proposed,
        };

        self.recommendations.push(rec.clone());
        rec
    }

    /// Record block production
    pub fn record_block_proposed(&mut self) {
        self.metrics.blocks_proposed += 1;
        self.update_performance();
    }

    /// Record missed block
    pub fn record_block_missed(&mut self) {
        self.metrics.blocks_missed += 1;
        self.update_performance();
    }

    fn update_performance(&mut self) {
        let total = self.metrics.blocks_proposed + self.metrics.blocks_missed;
        if total > 0 {
            self.metrics.uptime = self.metrics.blocks_proposed as f64 / total as f64;
        }
        self.metrics.performance_score = self.metrics.uptime * 0.6
            + self.metrics.copilot_accuracy * 0.3
            + (1.0 - self.metrics.slashing_events as f64 * 0.1).max(0.0) * 0.1;
    }

    pub fn metrics(&self) -> &ValidatorMetrics {
        &self.metrics
    }

    pub fn recommendations(&self) -> &[CoPilotRecommendation] {
        &self.recommendations
    }
}
