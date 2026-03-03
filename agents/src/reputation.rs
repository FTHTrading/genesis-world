//! Agent Reputation System
//!
//! Agents have reputation scores derived from:
//! - Decision approval rates
//! - Treasury impact
//! - Constitutional compliance
//! - Uptime
//! - Peer assessment
//!
//! Reputation affects: autonomy level, staking weight, compute allocation

use gsp_kernel::Epoch;
use serde::{Deserialize, Serialize};

/// Reputation components
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReputationBreakdown {
    pub approval_rate: f64,
    pub treasury_impact_score: f64,
    pub compliance_score: f64,
    pub uptime_score: f64,
    pub peer_score: f64,
    pub overall: f64,
}

/// Reputation system
pub struct ReputationSystem {
    weights: ReputationWeights,
}

#[derive(Debug, Clone)]
pub struct ReputationWeights {
    pub approval_weight: f64,
    pub treasury_weight: f64,
    pub compliance_weight: f64,
    pub uptime_weight: f64,
    pub peer_weight: f64,
}

impl Default for ReputationWeights {
    fn default() -> Self {
        Self {
            approval_weight: 0.25,
            treasury_weight: 0.25,
            compliance_weight: 0.20,
            uptime_weight: 0.15,
            peer_weight: 0.15,
        }
    }
}

impl ReputationSystem {
    pub fn new(weights: ReputationWeights) -> Self {
        Self { weights }
    }

    /// Calculate reputation breakdown
    pub fn calculate(
        &self,
        decisions_made: u32,
        decisions_approved: u32,
        treasury_impact: f64,   // normalized -1.0 to 1.0
        violations: u32,
        total_epochs: u32,
        uptime: f64,            // 0.0 to 1.0
        peer_scores: &[f64],    // 0.0 to 1.0
    ) -> ReputationBreakdown {
        let approval_rate = if decisions_made > 0 {
            decisions_approved as f64 / decisions_made as f64
        } else {
            0.5
        };

        let treasury_impact_score = ((treasury_impact + 1.0) / 2.0).clamp(0.0, 1.0);

        let compliance_score = if total_epochs > 0 {
            let violation_rate = violations as f64 / total_epochs as f64;
            (1.0 - violation_rate * 10.0).clamp(0.0, 1.0)
        } else {
            1.0
        };

        let uptime_score = uptime.clamp(0.0, 1.0);

        let peer_score = if peer_scores.is_empty() {
            0.5
        } else {
            peer_scores.iter().sum::<f64>() / peer_scores.len() as f64
        };

        let overall = approval_rate * self.weights.approval_weight
            + treasury_impact_score * self.weights.treasury_weight
            + compliance_score * self.weights.compliance_weight
            + uptime_score * self.weights.uptime_weight
            + peer_score * self.weights.peer_weight;

        ReputationBreakdown {
            approval_rate,
            treasury_impact_score,
            compliance_score,
            uptime_score,
            peer_score,
            overall: overall.clamp(0.0, 1.0),
        }
    }

    /// Determine if an agent should be slashed based on reputation
    pub fn should_slash(&self, reputation: &ReputationBreakdown) -> bool {
        reputation.compliance_score < 0.3 || reputation.overall < 0.15
    }

    /// Determine autonomy level adjustment based on reputation
    pub fn autonomy_adjustment(&self, reputation: &ReputationBreakdown) -> f64 {
        if reputation.overall > 0.8 {
            0.02 // increase autonomy
        } else if reputation.overall < 0.3 {
            -0.05 // decrease autonomy
        } else {
            0.0
        }
    }
}
