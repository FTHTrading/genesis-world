//! Entropy Engine — Controlled Chaos with Constitutional Guardrails
//!
//! Each epoch the Entropy Engine:
//! 1. Injects controlled randomness derived from validator signatures
//! 2. Adjusts staking rewards within bounded ranges
//! 3. Modifies inflation curves per constitutional invariants
//! 4. Mutates validator weights within allowed deltas
//!
//! Chaos with guardrails. Every mutation is deterministic and reproducible.

use crate::types::*;
use rand::Rng;
use rand::SeedableRng;
use rand_chacha::ChaCha20Rng;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};

/// Entropy injection result for an epoch
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EntropyInjection {
    pub epoch: Epoch,
    pub entropy_hash: String,
    pub staking_reward_delta: f64,
    pub inflation_delta: f64,
    pub validator_weight_mutations: Vec<WeightMutation>,
    pub economic_adjustments: EconomicAdjustment,
    pub bounded_by: Vec<String>, // invariant IDs that constrained this injection
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WeightMutation {
    pub validator_id: ValidatorId,
    pub old_weight: ValidatorWeight,
    pub new_weight: ValidatorWeight,
    pub delta: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EconomicAdjustment {
    pub base_inflation_rate: f64,
    pub adjusted_inflation_rate: f64,
    pub base_staking_apy: f64,
    pub adjusted_staking_apy: f64,
    pub treasury_fee_rate: f64,
    pub adjusted_fee_rate: f64,
}

/// Constitutional bounds that entropy cannot violate
#[derive(Debug, Clone)]
pub struct EntropyBounds {
    pub max_inflation_rate: f64,
    pub min_inflation_rate: f64,
    pub max_staking_apy: f64,
    pub min_staking_apy: f64,
    pub max_weight_delta_pct: f64,
    pub max_fee_rate: f64,
    pub min_fee_rate: f64,
    pub max_entropy_magnitude: f64,
}

impl Default for EntropyBounds {
    fn default() -> Self {
        Self {
            max_inflation_rate: 0.15,    // 15% max
            min_inflation_rate: 0.01,    // 1% min
            max_staking_apy: 0.25,      // 25% max
            min_staking_apy: 0.03,      // 3% min
            max_weight_delta_pct: 0.05,  // 5% max weight change
            max_fee_rate: 0.10,         // 10% max
            min_fee_rate: 0.001,        // 0.1% min
            max_entropy_magnitude: 0.1,  // Max 10% swing per epoch
        }
    }
}

/// The Entropy Engine
pub struct EntropyEngine {
    bounds: EntropyBounds,
    current_seed: Hash256,
    history: Vec<EntropyInjection>,
    current_inflation: f64,
    current_staking_apy: f64,
    current_fee_rate: f64,
}

impl EntropyEngine {
    pub fn new(initial_seed: Hash256, bounds: EntropyBounds) -> Self {
        Self {
            bounds,
            current_seed: initial_seed,
            history: Vec::new(),
            current_inflation: 0.05,   // 5% initial
            current_staking_apy: 0.08, // 8% initial
            current_fee_rate: 0.02,    // 2% initial
        }
    }

    /// Generate entropy injection for an epoch.
    /// This is fully deterministic given the seed and validator data.
    pub fn inject_entropy(
        &mut self,
        epoch: Epoch,
        validator_signatures: &[Hash256],
        validators: &mut [ValidatorNode],
    ) -> EntropyInjection {
        // Derive epoch entropy from seed + validator signatures
        let mut hasher = Sha256::new();
        hasher.update(self.current_seed);
        hasher.update(epoch.to_le_bytes());
        for sig in validator_signatures {
            hasher.update(sig);
        }
        let epoch_entropy: [u8; 32] = hasher.finalize().into();

        let mut rng = ChaCha20Rng::from_seed(epoch_entropy);

        // Generate bounded random deltas
        let raw_inflation_delta: f64 = rng.gen_range(-1.0..1.0) * self.bounds.max_entropy_magnitude;
        let raw_staking_delta: f64 = rng.gen_range(-1.0..1.0) * self.bounds.max_entropy_magnitude;
        let raw_fee_delta: f64 = rng.gen_range(-1.0..1.0) * self.bounds.max_entropy_magnitude * 0.5;

        // Apply with constitutional bounds
        let new_inflation = (self.current_inflation + raw_inflation_delta * self.current_inflation)
            .clamp(self.bounds.min_inflation_rate, self.bounds.max_inflation_rate);
        let new_staking = (self.current_staking_apy + raw_staking_delta * self.current_staking_apy)
            .clamp(self.bounds.min_staking_apy, self.bounds.max_staking_apy);
        let new_fee = (self.current_fee_rate + raw_fee_delta * self.current_fee_rate)
            .clamp(self.bounds.min_fee_rate, self.bounds.max_fee_rate);

        let inflation_delta = new_inflation - self.current_inflation;
        let staking_delta = new_staking - self.current_staking_apy;

        // Mutate validator weights within bounds
        let mut weight_mutations = Vec::new();
        let mut bounded_by = Vec::new();

        for validator in validators.iter_mut() {
            let weight_delta: f64 = rng.gen_range(-1.0..1.0) * self.bounds.max_weight_delta_pct;
            let old_weight = validator.weight;
            let delta = (old_weight as f64 * weight_delta) as i32;
            let new_weight = (old_weight as i32 + delta).clamp(1, 10000) as u32;

            if new_weight != old_weight {
                weight_mutations.push(WeightMutation {
                    validator_id: validator.id.clone(),
                    old_weight,
                    new_weight,
                    delta,
                });
                validator.weight = new_weight;
            }
        }

        // Track which bounds were hit
        if new_inflation == self.bounds.max_inflation_rate || new_inflation == self.bounds.min_inflation_rate {
            bounded_by.push("MaxInflationRate".into());
        }
        if new_staking == self.bounds.max_staking_apy || new_staking == self.bounds.min_staking_apy {
            bounded_by.push("MaxStakingAPY".into());
        }

        let economic_adjustments = EconomicAdjustment {
            base_inflation_rate: self.current_inflation,
            adjusted_inflation_rate: new_inflation,
            base_staking_apy: self.current_staking_apy,
            adjusted_staking_apy: new_staking,
            treasury_fee_rate: self.current_fee_rate,
            adjusted_fee_rate: new_fee,
        };

        // Update state
        self.current_inflation = new_inflation;
        self.current_staking_apy = new_staking;
        self.current_fee_rate = new_fee;
        self.current_seed = epoch_entropy;

        let injection = EntropyInjection {
            epoch,
            entropy_hash: hex::encode(epoch_entropy),
            staking_reward_delta: staking_delta,
            inflation_delta,
            validator_weight_mutations: weight_mutations,
            economic_adjustments,
            bounded_by,
        };

        self.history.push(injection.clone());
        injection
    }

    /// Get the full entropy history
    pub fn history(&self) -> &[EntropyInjection] {
        &self.history
    }

    /// Current economic state
    pub fn current_inflation(&self) -> f64 {
        self.current_inflation
    }

    pub fn current_staking_apy(&self) -> f64 {
        self.current_staking_apy
    }

    pub fn current_fee_rate(&self) -> f64 {
        self.current_fee_rate
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_entropy_stays_bounded() {
        let seed = [77u8; 32];
        let bounds = EntropyBounds::default();
        let mut engine = EntropyEngine::new(seed, bounds.clone());

        let mut validators: Vec<ValidatorNode> = (0..5)
            .map(|i| ValidatorNode {
                id: ValidatorId(format!("v{}", i)),
                weight: 2000,
                assigned_realms: vec![],
                collateral: 10000,
            })
            .collect();

        // Run 100 epochs of entropy
        for epoch in 0..100 {
            let sigs: Vec<Hash256> = vec![[epoch as u8; 32]];
            let injection = engine.inject_entropy(epoch, &sigs, &mut validators);

            assert!(
                injection.economic_adjustments.adjusted_inflation_rate >= bounds.min_inflation_rate
            );
            assert!(
                injection.economic_adjustments.adjusted_inflation_rate <= bounds.max_inflation_rate
            );
            assert!(
                injection.economic_adjustments.adjusted_staking_apy >= bounds.min_staking_apy
            );
            assert!(
                injection.economic_adjustments.adjusted_staking_apy <= bounds.max_staking_apy
            );
        }

        println!("Final inflation: {:.4}%", engine.current_inflation() * 100.0);
        println!("Final staking APY: {:.4}%", engine.current_staking_apy() * 100.0);
    }
}
