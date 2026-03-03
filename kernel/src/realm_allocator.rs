//! Realm Allocator — Fractal spawn engine
//!
//! At genesis, the Realm Allocator:
//! 1. Takes realm configurations from the genesis seed
//! 2. Assigns validators to realms based on stake + affinity
//! 3. Allocates treasury capital per realm
//! 4. Generates agent birth certificates
//! 5. Creates the sovereign realm topology

use crate::types::*;
use rand::Rng;
use rand::SeedableRng;
use rand_chacha::ChaCha20Rng;
use sha2::{Digest, Sha256};

/// The Realm Allocator engine
pub struct RealmAllocator {
    realms: Vec<RealmAllocation>,
    agent_births: Vec<AgentBirthCertificate>,
}

impl RealmAllocator {
    /// Allocate realms from genesis seed configuration
    pub fn allocate(
        seed: &GenesisSeed,
        topology: &ValidatorTopology,
        entropy: &Hash256,
    ) -> Self {
        let mut rng_seed = [0u8; 32];
        let mut hasher = Sha256::new();
        hasher.update(entropy);
        hasher.update(b"realm-allocation");
        rng_seed.copy_from_slice(&hasher.finalize());
        let mut rng = ChaCha20Rng::from_seed(rng_seed);

        let mut realms = Vec::new();
        let mut all_agent_births = Vec::new();
        let total_validators = topology.validators.len();

        for realm_config in &seed.realms {
            let realm_id = RealmId::new(&realm_config.name);

            // Assign validators — prefer those that listed this realm
            let mut assigned: Vec<ValidatorId> = topology
                .validators
                .iter()
                .filter(|v| v.assigned_realms.contains(&realm_id))
                .map(|v| v.id.clone())
                .collect();

            // Ensure minimum validator count
            if assigned.len() < 3 {
                for v in &topology.validators {
                    if !assigned.contains(&v.id) && assigned.len() < 3 {
                        assigned.push(v.id.clone());
                    }
                }
            }

            // Generate agents for this realm
            let mut agent_ids = Vec::new();
            for i in 0..realm_config.agent_count {
                let agent_birth = Self::birth_agent(
                    &realm_id,
                    realm_config.rail_type,
                    i,
                    0, // genesis epoch
                    &seed.constitutional_invariants,
                    &mut rng,
                    entropy,
                );
                agent_ids.push(agent_birth.agent_id.clone());
                all_agent_births.push(agent_birth);
            }

            realms.push(RealmAllocation {
                realm_id,
                rail_type: realm_config.rail_type,
                runtime: realm_config.runtime,
                validator_set: assigned,
                treasury_balance: realm_config.initial_treasury_allocation,
                agent_ids,
            });
        }

        Self {
            realms,
            agent_births: all_agent_births,
        }
    }

    /// Birth a single agent with deterministic DNA
    fn birth_agent(
        realm_id: &RealmId,
        rail_type: RailType,
        index: u32,
        epoch: Epoch,
        invariants: &[ConstitutionalInvariant],
        rng: &mut ChaCha20Rng,
        entropy: &Hash256,
    ) -> AgentBirthCertificate {
        // Generate agent ID
        let mut hasher = Sha256::new();
        hasher.update(realm_id.0.as_bytes());
        hasher.update(epoch.to_le_bytes());
        hasher.update(index.to_le_bytes());
        hasher.update(entropy);
        let agent_hash: [u8; 32] = hasher.finalize().into();
        let agent_id = hex::encode(&agent_hash[..16]);

        // Generate name based on lineage
        let lineage = rail_type.agent_lineage();
        let greek_roots = match rail_type {
            RailType::Finance => &["Helion", "Kyros", "Virex", "Auris", "Plex"][..],
            RailType::Governance => &["Ordin", "Civis", "Vetra", "Jurix", "Legis"][..],
            RailType::Research => &["Quantis", "Axiom", "Syrix", "Theori", "Empiris"][..],
            RailType::Trade => &["Flux", "Orbit", "Vector", "Nexis", "Cypher"][..],
            RailType::Chaos => &["Arc", "Morph", "Vanta", "Prism", "Entropy"][..],
        };
        let root = greek_roots[index as usize % greek_roots.len()];
        let name = format!("{}-{}-{:03}", lineage, root, index + 1);

        // Generate genetic vector based on rail type template + bounded randomness
        let genetic_vector = Self::generate_dna(rail_type, rng);

        // Constitutional hash
        let mut const_hasher = Sha256::new();
        for inv in invariants {
            const_hasher.update(inv.id.as_bytes());
        }
        let constitutional_hash = hex::encode(const_hasher.finalize());

        // DNA hash
        let dna_bytes = serde_json::to_vec(&genetic_vector).unwrap_or_default();
        let mut dna_hasher = Sha256::new();
        dna_hasher.update(&dna_bytes);
        let dna_hash = hex::encode(dna_hasher.finalize());

        AgentBirthCertificate {
            agent_id,
            name,
            realm_id: realm_id.clone(),
            rail_type,
            dna_hash,
            birth_epoch: epoch,
            constitutional_hash,
            genetic_vector,
        }
    }

    /// Generate DNA vector based on rail type template with bounded randomness
    fn generate_dna(rail_type: RailType, rng: &mut ChaCha20Rng) -> GeneticVector {
        let (opt_base, risk_base, entropy_base, autonomy_base, gov_base) = match rail_type {
            RailType::Finance => (0.85, 0.30, 0.20, 0.50, 0.60),
            RailType::Governance => (0.50, 0.25, 0.15, 0.40, 0.95),
            RailType::Research => (0.60, 0.70, 0.80, 0.75, 0.50),
            RailType::Trade => (0.80, 0.65, 0.50, 0.70, 0.40),
            RailType::Chaos => (0.50, 0.80, 0.90, 0.60, 0.30),
        };

        let variance: f64 = 0.1; // ±10% random variance

        GeneticVector {
            optimization_bias: (opt_base + rng.gen_range(-variance..variance)).clamp(0.0, 1.0),
            risk_tolerance: (risk_base + rng.gen_range(-variance..variance)).clamp(0.0, 1.0),
            entropy_sensitivity: (entropy_base + rng.gen_range(-variance..variance)).clamp(0.0, 1.0),
            autonomy_level: (autonomy_base + rng.gen_range(-variance..variance)).clamp(0.0, 1.0),
            governance_alignment: (gov_base + rng.gen_range(-variance..variance)).clamp(0.0, 1.0),
        }
    }

    /// Get allocated realms
    pub fn realms(&self) -> &[RealmAllocation] {
        &self.realms
    }

    /// Get all agent births
    pub fn agent_births(&self) -> &[AgentBirthCertificate] {
        &self.agent_births
    }

    /// Get agents for a specific realm
    pub fn realm_agents(&self, realm_id: &RealmId) -> Vec<&AgentBirthCertificate> {
        self.agent_births
            .iter()
            .filter(|a| a.realm_id == *realm_id)
            .collect()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_realm_allocation() {
        let seed = GenesisSeed {
            protocol_name: "Genesis Sentience Protocol".into(),
            protocol_version: "0.1.0".into(),
            initial_entropy: "cosmic-ignition".into(),
            realms: vec![
                RealmConfig {
                    name: "Finance".into(),
                    rail_type: RailType::Finance,
                    runtime: RuntimeType::WASM,
                    initial_treasury_allocation: 1_000_000,
                    agent_count: 3,
                    custom_params: HashMap::new(),
                },
                RealmConfig {
                    name: "Governance".into(),
                    rail_type: RailType::Governance,
                    runtime: RuntimeType::WASM,
                    initial_treasury_allocation: 500_000,
                    agent_count: 3,
                    custom_params: HashMap::new(),
                },
            ],
            validators: vec![],
            constitutional_invariants: vec![ConstitutionalInvariant {
                id: "min-reserve".into(),
                description: "Minimum reserve ratio".into(),
                invariant_type: InvariantType::MinReserveRatio,
                threshold: 0.1,
            }],
            token_config: TokenGenesisConfig {
                core_supply: 100_000_000,
                origin_supply: 10_000_000,
                core_emission_rate: 0.05,
                staking_reward_base: 0.08,
                rail_allocations: HashMap::new(),
            },
        };

        let topology = ValidatorTopology {
            validators: (0..5)
                .map(|i| ValidatorNode {
                    id: ValidatorId(format!("v{}", i)),
                    weight: 2000,
                    assigned_realms: vec![RealmId::new("finance"), RealmId::new("governance")],
                    collateral: 10000,
                })
                .collect(),
            resilience_score: 0.8,
            decentralization_index: 0.7,
            simulations_run: 100,
        };

        let entropy = [99u8; 32];
        let allocator = RealmAllocator::allocate(&seed, &topology, &entropy);

        assert_eq!(allocator.realms().len(), 2);
        assert_eq!(allocator.agent_births().len(), 6);

        for agent in allocator.agent_births() {
            println!("{}: opt={:.2} risk={:.2} entropy={:.2}",
                agent.name,
                agent.genetic_vector.optimization_bias,
                agent.genetic_vector.risk_tolerance,
                agent.genetic_vector.entropy_sensitivity,
            );
        }
    }
}
