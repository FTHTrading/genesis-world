//! Emission Engine — AI-adjusted token emission with constitutional bounds
//!
//! $CORE: Deflationary bias + AI-adjusted staking rewards
//! Rail tokens: Dynamic inflation based on rail productivity
//!
//! The emission engine is the monetary policy of the civilization.

use gsp_kernel::{Epoch, RailType};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Emission schedule for a single epoch
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EpochEmission {
    pub epoch: Epoch,
    pub core_emitted: u64,
    pub core_burned: u64,
    pub net_core_emission: i64,
    pub staking_rewards: u64,
    pub compute_credits_minted: u64,
    pub rail_emissions: HashMap<RailType, u64>,
    pub effective_inflation_rate: f64,
    pub ai_adjusted: bool,
}

/// Emission configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EmissionConfig {
    /// Base emission per epoch (before adjustments)
    pub base_epoch_emission: u64,
    /// Target annual inflation rate
    pub target_inflation: f64,
    /// Minimum inflation rate
    pub min_inflation: f64,
    /// Maximum inflation rate
    pub max_inflation: f64,
    /// Burn rate on transaction fees
    pub fee_burn_rate: f64,
    /// Halving interval in epochs
    pub halving_interval: u64,
    /// Staking reward percentage of emission
    pub staking_reward_pct: f64,
    /// Compute credit percentage of emission
    pub compute_credit_pct: f64,
}

impl Default for EmissionConfig {
    fn default() -> Self {
        Self {
            base_epoch_emission: 1_000_000,
            target_inflation: 0.05,     // 5%
            min_inflation: 0.01,        // 1%
            max_inflation: 0.15,        // 15%
            fee_burn_rate: 0.50,        // 50% of fees burned
            halving_interval: 1000,     // halve every 1000 epochs
            staking_reward_pct: 0.70,   // 70% of emission to staking
            compute_credit_pct: 0.20,   // 20% to compute credits
        }
    }
}

/// The Emission Engine
pub struct EmissionEngine {
    config: EmissionConfig,
    total_supply: u64,
    total_emitted: u64,
    total_burned: u64,
    history: Vec<EpochEmission>,
    rail_productivity: HashMap<RailType, f64>,
}

impl EmissionEngine {
    pub fn new(config: EmissionConfig, initial_supply: u64) -> Self {
        Self {
            config,
            total_supply: initial_supply,
            total_emitted: 0,
            total_burned: 0,
            history: Vec::new(),
            rail_productivity: HashMap::new(),
        }
    }

    /// Calculate emission for an epoch
    pub fn calculate_epoch_emission(
        &mut self,
        epoch: Epoch,
        fee_revenue: u64,
        _total_staked: u64,
        ai_inflation_adjustment: Option<f64>,
    ) -> EpochEmission {
        // Apply halving
        let halvings = epoch / self.config.halving_interval;
        let halving_factor = 0.5_f64.powi(halvings as i32);
        let base_emission = (self.config.base_epoch_emission as f64 * halving_factor) as u64;

        // AI adjustment
        let adjusted_emission = if let Some(adj) = ai_inflation_adjustment {
            let adjustment = (1.0 + adj).clamp(
                self.config.min_inflation / self.config.target_inflation,
                self.config.max_inflation / self.config.target_inflation,
            );
            (base_emission as f64 * adjustment) as u64
        } else {
            base_emission
        };

        // Calculate burns
        let fee_burns = (fee_revenue as f64 * self.config.fee_burn_rate) as u64;

        // Net emission
        let net_emission = adjusted_emission as i64 - fee_burns as i64;

        // Staking rewards
        let staking_rewards = (adjusted_emission as f64 * self.config.staking_reward_pct) as u64;

        // Compute credits
        let compute_credits = (adjusted_emission as f64 * self.config.compute_credit_pct) as u64;

        // Rail emissions (dynamic based on productivity)
        let mut rail_emissions = HashMap::new();
        let remaining = adjusted_emission - staking_rewards - compute_credits;
        let rail_count = 5;
        let per_rail_base = remaining / rail_count;

        for rail in &[
            RailType::Finance,
            RailType::Governance,
            RailType::Research,
            RailType::Trade,
            RailType::Chaos,
        ] {
            let productivity = self.rail_productivity.get(rail).copied().unwrap_or(1.0);
            let rail_emission = (per_rail_base as f64 * productivity) as u64;
            rail_emissions.insert(*rail, rail_emission);
        }

        // Update totals
        self.total_emitted += adjusted_emission;
        self.total_burned += fee_burns;
        self.total_supply = self.total_supply + adjusted_emission - fee_burns;

        let effective_inflation = if self.total_supply > 0 {
            adjusted_emission as f64 / self.total_supply as f64
        } else {
            0.0
        };

        let emission = EpochEmission {
            epoch,
            core_emitted: adjusted_emission,
            core_burned: fee_burns,
            net_core_emission: net_emission,
            staking_rewards,
            compute_credits_minted: compute_credits,
            rail_emissions,
            effective_inflation_rate: effective_inflation,
            ai_adjusted: ai_inflation_adjustment.is_some(),
        };

        self.history.push(emission.clone());
        emission
    }

    /// Update rail productivity scores
    pub fn update_rail_productivity(&mut self, rail: RailType, productivity: f64) {
        self.rail_productivity
            .insert(rail, productivity.clamp(0.1, 3.0));
    }

    pub fn total_supply(&self) -> u64 {
        self.total_supply
    }

    pub fn total_emitted(&self) -> u64 {
        self.total_emitted
    }

    pub fn total_burned(&self) -> u64 {
        self.total_burned
    }

    pub fn history(&self) -> &[EpochEmission] {
        &self.history
    }

    /// Calculate annual inflation rate based on recent history
    pub fn annual_inflation_rate(&self, epochs_per_year: u64) -> f64 {
        let recent: Vec<&EpochEmission> = self
            .history
            .iter()
            .rev()
            .take(epochs_per_year as usize)
            .collect();

        if recent.is_empty() || self.total_supply == 0 {
            return 0.0;
        }

        let annual_emission: u64 = recent.iter().map(|e| e.core_emitted).sum();
        let annual_burns: u64 = recent.iter().map(|e| e.core_burned).sum();
        let net = annual_emission as f64 - annual_burns as f64;

        net / self.total_supply as f64
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_emission_with_halving() {
        let config = EmissionConfig::default();
        let mut engine = EmissionEngine::new(config, 1_000_000_000);

        // Epoch 0
        let e0 = engine.calculate_epoch_emission(0, 100_000, 500_000_000, None);
        assert_eq!(e0.core_emitted, 1_000_000);

        // Epoch 1000 (first halving)
        let e1000 = engine.calculate_epoch_emission(1000, 100_000, 500_000_000, None);
        assert_eq!(e1000.core_emitted, 500_000);

        // With AI adjustment
        let e_adj = engine.calculate_epoch_emission(1, 100_000, 500_000_000, Some(0.05));
        println!("AI-adjusted emission: {}", e_adj.core_emitted);
        assert!(e_adj.ai_adjusted);
    }

    #[test]
    fn test_deflationary_bias() {
        let config = EmissionConfig {
            fee_burn_rate: 0.80, // heavy burn
            ..EmissionConfig::default()
        };
        let mut engine = EmissionEngine::new(config, 1_000_000_000);

        // High fee revenue should cause net deflation
        let emission = engine.calculate_epoch_emission(0, 2_000_000, 500_000_000, None);
        assert!(emission.net_core_emission < 0, "Should be deflationary with high fees");
    }
}
