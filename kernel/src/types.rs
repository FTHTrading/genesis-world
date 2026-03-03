use serde::{Deserialize, Serialize};

/// Hash type used throughout the protocol
pub type Hash256 = [u8; 32];

/// Epoch number
pub type Epoch = u64;

/// Block height
pub type BlockHeight = u64;

/// Validator weight (basis points, 0-10000)
pub type ValidatorWeight = u32;

/// Unique identifier for a realm
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct RealmId(pub String);

impl RealmId {
    pub fn new(name: &str) -> Self {
        Self(name.to_lowercase().replace(' ', "-"))
    }
}

/// Validator identity
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct ValidatorId(pub String);

/// The runtime environment a realm can choose
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum RuntimeType {
    EVM,
    WASM,
    ZKNative,
    AIAssisted,
}

/// Rail type determines the economic DNA of a realm
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum RailType {
    Finance,
    Governance,
    Research,
    Trade,
    Chaos,
}

impl RailType {
    pub fn token_symbol(&self) -> &'static str {
        match self {
            RailType::Finance => "AURUM",
            RailType::Governance => "LEX",
            RailType::Research => "NOVA",
            RailType::Trade => "MERC",
            RailType::Chaos => "LUDO",
        }
    }

    pub fn agent_lineage(&self) -> &'static str {
        match self {
            RailType::Finance => "AURUM",
            RailType::Governance => "LEXICON",
            RailType::Research => "NOVA",
            RailType::Trade => "MERCATOR",
            RailType::Chaos => "LUDOS",
        }
    }
}

/// Block header in the Trinity mesh
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BlockHeader {
    pub height: BlockHeight,
    pub epoch: Epoch,
    pub timestamp: i64,
    pub parent_hash: Hash256,
    pub state_root: Hash256,
    pub entropy_seed: Hash256,
    pub proposer: ValidatorId,
    pub realm_id: Option<RealmId>,
}

/// Genesis seed configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GenesisSeed {
    pub protocol_name: String,
    pub protocol_version: String,
    pub initial_entropy: String,
    pub realms: Vec<RealmConfig>,
    pub validators: Vec<ValidatorConfig>,
    pub constitutional_invariants: Vec<ConstitutionalInvariant>,
    pub token_config: TokenGenesisConfig,
}

/// Configuration for a realm at genesis
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RealmConfig {
    pub name: String,
    pub rail_type: RailType,
    pub runtime: RuntimeType,
    pub initial_treasury_allocation: u64,
    pub agent_count: u32,
    pub custom_params: std::collections::HashMap<String, String>,
}

/// Configuration for a validator at genesis
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ValidatorConfig {
    pub id: String,
    pub stake: u64,
    pub realms: Vec<String>,
    pub pubkey: String,
}

/// Constitutional invariant — rules AI cannot break
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConstitutionalInvariant {
    pub id: String,
    pub description: String,
    pub invariant_type: InvariantType,
    pub threshold: f64,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub enum InvariantType {
    MinReserveRatio,
    MaxInflationRate,
    MinValidatorCount,
    MaxAgentAutonomy,
    MaxEntropyDelta,
    MinGovernanceQuorum,
}

/// Token genesis configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TokenGenesisConfig {
    pub core_supply: u64,
    pub origin_supply: u64,
    pub core_emission_rate: f64,
    pub staking_reward_base: f64,
    pub rail_allocations: std::collections::HashMap<String, u64>,
}

/// Result of genesis simulation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GenesisResult {
    pub genesis_hash: String,
    pub selected_topology: ValidatorTopology,
    pub realm_allocations: Vec<RealmAllocation>,
    pub entropy_seed: String,
    pub block_zero_header: BlockHeader,
    pub agent_births: Vec<AgentBirthCertificate>,
    pub treasury_state: TreasuryState,
}

/// Validator topology selected from simulation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ValidatorTopology {
    pub validators: Vec<ValidatorNode>,
    pub resilience_score: f64,
    pub decentralization_index: f64,
    pub simulations_run: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ValidatorNode {
    pub id: ValidatorId,
    pub weight: ValidatorWeight,
    pub assigned_realms: Vec<RealmId>,
    pub collateral: u64,
}

/// Realm allocation result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RealmAllocation {
    pub realm_id: RealmId,
    pub rail_type: RailType,
    pub runtime: RuntimeType,
    pub validator_set: Vec<ValidatorId>,
    pub treasury_balance: u64,
    pub agent_ids: Vec<String>,
}

/// Agent birth certificate — minted at genesis
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentBirthCertificate {
    pub agent_id: String,
    pub name: String,
    pub realm_id: RealmId,
    pub rail_type: RailType,
    pub dna_hash: String,
    pub birth_epoch: Epoch,
    pub constitutional_hash: String,
    pub genetic_vector: GeneticVector,
}

/// The genetic parameter vector for an agent
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GeneticVector {
    pub optimization_bias: f64,
    pub risk_tolerance: f64,
    pub entropy_sensitivity: f64,
    pub autonomy_level: f64,
    pub governance_alignment: f64,
}

/// Treasury state at genesis
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TreasuryState {
    pub core_balance: u64,
    pub origin_balance: u64,
    pub rail_balances: std::collections::HashMap<String, u64>,
    pub total_staked: u64,
    pub reserve_ratio: f64,
}
