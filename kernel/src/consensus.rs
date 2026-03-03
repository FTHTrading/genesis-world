//! Trinity Consensus Engine
//!
//! Hybridized consensus combining:
//! - Tendermint-style deterministic proposer rotation (Cosmos)
//! - BABE/GRANDPA block production & finality separation (Polkadot)
//! - Snowman++ fast finality confirmation (Avalanche)
//!
//! The Trinity Consensus treats realms as first-class citizens.
//! Each realm can have realm-specific finality while sharing
//! validator collateral through the Core Mesh.

use crate::types::*;
use rand::seq::SliceRandom;
use rand::SeedableRng;
use rand_chacha::ChaCha20Rng;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::collections::HashMap;

/// Consensus configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConsensusConfig {
    /// Block time in milliseconds
    pub block_time_ms: u64,
    /// Epoch length in blocks
    pub epoch_length: u64,
    /// Minimum validators for consensus
    pub min_validators: usize,
    /// Finality threshold (fraction of stake that must confirm)
    pub finality_threshold: f64,
    /// Snowman confidence threshold for fast finality
    pub snowman_confidence: u32,
    /// Maximum rounds for snowman polling
    pub snowman_max_rounds: u32,
}

impl Default for ConsensusConfig {
    fn default() -> Self {
        Self {
            block_time_ms: 2000,
            epoch_length: 1000,
            min_validators: 4,
            finality_threshold: 0.667,
            snowman_confidence: 20,
            snowman_max_rounds: 50,
        }
    }
}

/// The Trinity Consensus engine
pub struct TrinityConsensus {
    config: ConsensusConfig,
    validators: Vec<ValidatorNode>,
    current_epoch: Epoch,
    current_height: BlockHeight,
    proposer_index: usize,
    finalized_height: BlockHeight,
    realm_finality: HashMap<RealmId, BlockHeight>,
    entropy_seed: Hash256,
}

impl TrinityConsensus {
    pub fn new(config: ConsensusConfig, validators: Vec<ValidatorNode>, entropy_seed: Hash256) -> Self {
        Self {
            config,
            validators,
            current_epoch: 0,
            current_height: 0,
            proposer_index: 0,
            finalized_height: 0,
            realm_finality: HashMap::new(),
            entropy_seed,
        }
    }

    /// Simulate genesis validator topology selection.
    /// Runs N simulations and picks the most resilient configuration.
    pub fn simulate_genesis_topology(
        validators: &[ValidatorConfig],
        simulations: u32,
        entropy_seed: &[u8],
    ) -> ValidatorTopology {
        let mut best_topology: Option<ValidatorTopology> = None;
        let mut best_score: f64 = 0.0;

        for sim in 0..simulations {
            // Derive deterministic seed for this simulation
            let mut hasher = Sha256::new();
            hasher.update(entropy_seed);
            hasher.update(sim.to_le_bytes());
            let sim_seed: [u8; 32] = hasher.finalize().into();

            let mut rng = ChaCha20Rng::from_seed(sim_seed);

            // Generate randomized weights based on stake + variance
            let mut nodes: Vec<ValidatorNode> = validators
                .iter()
                .map(|v| {
                    let base_weight = ((v.stake as f64).sqrt() * 100.0) as u32;
                    let weight = base_weight.min(10000);
                    ValidatorNode {
                        id: ValidatorId(v.id.clone()),
                        weight,
                        assigned_realms: v.realms.iter().map(|r| RealmId::new(r)).collect(),
                        collateral: v.stake,
                    }
                })
                .collect();

            // Shuffle for randomized topology testing
            nodes.shuffle(&mut rng);

            // Calculate resilience score
            let total_stake: u64 = nodes.iter().map(|n| n.collateral).sum();
            let total_weight: u32 = nodes.iter().map(|n| n.weight).sum();

            // Nakamoto coefficient approximation
            let mut sorted_stakes: Vec<u64> = nodes.iter().map(|n| n.collateral).collect();
            sorted_stakes.sort_unstable_by(|a, b| b.cmp(a));

            let threshold = total_stake as f64 * 0.334;
            let mut accumulated = 0u64;
            let mut nakamoto = 0usize;
            for s in &sorted_stakes {
                accumulated += s;
                nakamoto += 1;
                if accumulated as f64 >= threshold {
                    break;
                }
            }

            // Gini coefficient for decentralization
            let n = nodes.len() as f64;
            let mean_stake = total_stake as f64 / n;
            let gini_sum: f64 = nodes
                .iter()
                .flat_map(|a| nodes.iter().map(move |b| (a.collateral as f64 - b.collateral as f64).abs()))
                .sum();
            let gini = gini_sum / (2.0 * n * n * mean_stake);
            let decentralization = 1.0 - gini;

            // Resilience = nakamoto coefficient * decentralization
            let resilience = (nakamoto as f64 / nodes.len() as f64) * decentralization;

            if resilience > best_score {
                best_score = resilience;
                best_topology = Some(ValidatorTopology {
                    validators: nodes,
                    resilience_score: resilience,
                    decentralization_index: decentralization,
                    simulations_run: sim + 1,
                });
            }
        }

        best_topology.unwrap_or(ValidatorTopology {
            validators: vec![],
            resilience_score: 0.0,
            decentralization_index: 0.0,
            simulations_run: simulations,
        })
    }

    /// Deterministic proposer rotation (Tendermint-inspired)
    pub fn select_proposer(&self) -> &ValidatorNode {
        let total_weight: u64 = self.validators.iter().map(|v| v.weight as u64).sum();
        if total_weight == 0 {
            return &self.validators[0];
        }

        // Weighted round-robin
        let mut hasher = Sha256::new();
        hasher.update(self.entropy_seed);
        hasher.update(self.current_height.to_le_bytes());
        let hash: [u8; 32] = hasher.finalize().into();
        let selection = u64::from_le_bytes(hash[0..8].try_into().unwrap()) % total_weight;

        let mut cumulative = 0u64;
        for v in &self.validators {
            cumulative += v.weight as u64;
            if cumulative > selection {
                return v;
            }
        }
        &self.validators[self.validators.len() - 1]
    }

    /// Produce a new block header
    pub fn produce_block(&mut self, realm_id: Option<RealmId>) -> BlockHeader {
        let proposer = self.select_proposer().clone();

        // Derive new entropy
        let mut hasher = Sha256::new();
        hasher.update(self.entropy_seed);
        hasher.update(self.current_height.to_le_bytes());
        hasher.update(proposer.id.0.as_bytes());
        let new_entropy: [u8; 32] = hasher.finalize().into();

        let parent_hash = self.entropy_seed; // simplified

        let header = BlockHeader {
            height: self.current_height + 1,
            epoch: self.current_height / self.config.epoch_length,
            timestamp: chrono::Utc::now().timestamp(),
            parent_hash,
            state_root: [0u8; 32], // computed by state machine
            entropy_seed: new_entropy,
            proposer: proposer.id,
            realm_id,
        };

        self.current_height += 1;
        self.entropy_seed = new_entropy;

        // Check epoch transition
        if self.current_height % self.config.epoch_length == 0 {
            self.current_epoch += 1;
        }

        header
    }

    /// Snowman++ inspired fast finality check
    /// Returns true if block reaches confidence threshold
    pub fn check_snowman_finality(
        &self,
        block_height: BlockHeight,
        confirmations: &[ValidatorId],
    ) -> bool {
        let confirming_stake: u64 = confirmations
            .iter()
            .filter_map(|vid| self.validators.iter().find(|v| v.id == *vid))
            .map(|v| v.collateral)
            .sum();

        let total_stake: u64 = self.validators.iter().map(|v| v.collateral).sum();

        if total_stake == 0 {
            return false;
        }

        let ratio = confirming_stake as f64 / total_stake as f64;
        ratio >= self.config.finality_threshold
    }

    /// Finalize a block for a specific realm
    pub fn finalize_realm_block(&mut self, realm_id: &RealmId, height: BlockHeight) {
        let entry = self.realm_finality.entry(realm_id.clone()).or_insert(0);
        if height > *entry {
            *entry = height;
        }
    }

    /// Get current state
    pub fn current_height(&self) -> BlockHeight {
        self.current_height
    }

    pub fn current_epoch(&self) -> Epoch {
        self.current_epoch
    }

    pub fn validator_count(&self) -> usize {
        self.validators.len()
    }

    pub fn total_stake(&self) -> u64 {
        self.validators.iter().map(|v| v.collateral).sum()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn make_validators() -> Vec<ValidatorConfig> {
        (0..10)
            .map(|i| ValidatorConfig {
                id: format!("validator-{}", i),
                stake: 1000 * (i + 1),
                realms: vec!["finance".into(), "governance".into()],
                pubkey: format!("0x{:064x}", i),
            })
            .collect()
    }

    #[test]
    fn test_genesis_topology_simulation() {
        let validators = make_validators();
        let seed = [42u8; 32];
        let topology = TrinityConsensus::simulate_genesis_topology(&validators, 100, &seed);

        assert!(!topology.validators.is_empty());
        assert!(topology.resilience_score > 0.0);
        assert!(topology.decentralization_index > 0.0);
        println!("Resilience: {:.4}", topology.resilience_score);
        println!("Decentralization: {:.4}", topology.decentralization_index);
    }

    #[test]
    fn test_block_production() {
        let validators = make_validators();
        let seed = [42u8; 32];
        let topology = TrinityConsensus::simulate_genesis_topology(&validators, 10, &seed);

        let config = ConsensusConfig::default();
        let mut consensus = TrinityConsensus::new(config, topology.validators, seed);

        let block = consensus.produce_block(Some(RealmId::new("finance")));
        assert_eq!(block.height, 1);
        assert_eq!(block.realm_id, Some(RealmId::new("finance")));

        let block2 = consensus.produce_block(None);
        assert_eq!(block2.height, 2);
    }
}
