//! Genesis Compiler CLI — trinity-genesis
//!
//! Compiles a genesis seed YAML into a deterministic genesis state.
//! Usage: trinity-genesis compile seed.yaml [--output genesis.json] [--simulations N]

use anyhow::{Context, Result};
use clap::{Parser, Subcommand};
use gsp_kernel::{
    consensus::TrinityConsensus,
    realm_allocator::RealmAllocator,
    types::*,
};
use gsp_tokenomics::tokens::GenesisTokenAllocation;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::collections::HashMap;
use std::path::PathBuf;

#[derive(Parser)]
#[command(name = "trinity-genesis")]
#[command(about = "Genesis Sentience Protocol — Compiler CLI")]
#[command(version = "0.1.0")]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    /// Compile a genesis seed file into a genesis state
    Compile {
        /// Path to the genesis seed YAML file
        seed_file: PathBuf,

        /// Output path for the compiled genesis JSON
        #[arg(short, long, default_value = "genesis.json")]
        output: PathBuf,

        /// Number of topology simulations to run
        #[arg(short, long, default_value_t = 1000)]
        simulations: u32,
    },

    /// Validate a genesis seed file without compiling
    Validate {
        /// Path to the genesis seed YAML file
        seed_file: PathBuf,
    },

    /// Generate a template seed file
    Template {
        /// Output path for the template
        #[arg(short, long, default_value = "seed-template.yaml")]
        output: PathBuf,
    },

    /// Inspect compiled genesis state
    Inspect {
        /// Path to the compiled genesis JSON
        genesis_file: PathBuf,
    },
}

// ───── SEED FILE SCHEMA ─────

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GenesisSeedFile {
    pub meta: SeedMeta,
    pub network: NetworkConfig,
    pub realms: Vec<SeedRealmConfig>,
    pub tokenomics: SeedTokenomics,
    pub validators: SeedValidatorConfig,
    pub agents: SeedAgentConfig,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SeedMeta {
    pub name: String,
    pub version: String,
    pub chain_id: String,
    pub genesis_time: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkConfig {
    pub block_time_ms: u64,
    pub epoch_length: u64,
    pub finality_threshold: f64,
    pub snowman_confidence: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SeedRealmConfig {
    pub name: String,
    pub rail_type: String,
    pub runtime_type: String,
    pub agents_per_realm: u32,
    pub initial_treasury: u64,
    pub description: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SeedTokenomics {
    pub core_supply: u64,
    pub origin_supply: u64,
    pub base_emission_per_epoch: u64,
    pub target_inflation: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SeedValidatorConfig {
    pub count: u32,
    pub min_stake: u64,
    pub topology_simulations: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SeedAgentConfig {
    pub initial_agents_per_realm: u32,
    pub lineages: Vec<String>,
}

// ───── COMPILED GENESIS STATE ─────

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CompiledGenesis {
    pub genesis_hash: String,
    pub chain_id: String,
    pub genesis_time: String,
    pub network_config: NetworkConfig,
    pub topology: TopologyResult,
    pub realm_allocations: Vec<RealmAllocationResult>,
    pub token_allocation: GenesisTokenAllocation,
    pub agent_births: Vec<AgentBirthRecord>,
    pub constitutional_invariants: Vec<String>,
    pub genesis_seed_hash: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TopologyResult {
    pub validator_count: u32,
    pub simulations_run: u32,
    pub resilience_score: f64,
    pub decentralization_index: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RealmAllocationResult {
    pub realm_name: String,
    pub rail_type: String,
    pub validator_count: u32,
    pub agent_count: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentBirthRecord {
    pub agent_id: String,
    pub name: String,
    pub realm: String,
    pub lineage: String,
    pub dna_hash: String,
}

// ───── HELPERS ─────

fn parse_rail_type(s: &str) -> RailType {
    match s.to_lowercase().as_str() {
        "finance" | "aurum" => RailType::Finance,
        "governance" | "lexicon" => RailType::Governance,
        "research" | "nova" => RailType::Research,
        "trade" | "mercator" => RailType::Trade,
        "chaos" | "ludos" => RailType::Chaos,
        _ => RailType::Chaos,
    }
}

fn parse_runtime_type(s: &str) -> RuntimeType {
    match s.to_lowercase().as_str() {
        "evm" => RuntimeType::EVM,
        "wasm" => RuntimeType::WASM,
        "zknative" | "zk" => RuntimeType::ZKNative,
        "aiassisted" | "ai" => RuntimeType::AIAssisted,
        _ => RuntimeType::WASM,
    }
}

// ───── COMPILATION ENGINE ─────

fn compile_genesis(seed: &GenesisSeedFile, sim_count: u32) -> Result<CompiledGenesis> {
    tracing::info!("Compiling genesis from seed: {}", seed.meta.name);

    // 1. Hash the seed for determinism proof
    let seed_yaml = serde_yaml::to_string(seed)?;
    let mut hasher = Sha256::new();
    hasher.update(seed_yaml.as_bytes());
    let seed_hash = hex::encode(hasher.finalize());
    tracing::info!("Seed hash: {}", seed_hash);

    // 2. Derive entropy from seed hash
    let mut entropy = [0u8; 32];
    let mut e_hasher = Sha256::new();
    e_hasher.update(seed_hash.as_bytes());
    e_hasher.update(b"genesis-entropy");
    entropy.copy_from_slice(&e_hasher.finalize());

    // 3. Build validator configs (using kernel's ValidatorConfig type)
    let validators: Vec<ValidatorConfig> = (0..seed.validators.count)
        .map(|i| ValidatorConfig {
            id: format!("validator-{:04}", i),
            stake: seed.validators.min_stake,
            realms: seed.realms.iter().map(|r| r.name.clone()).collect(),
            pubkey: format!("0x{:064x}", i),
        })
        .collect();

    // 4. Run topology simulation
    tracing::info!("Running {} topology simulations...", sim_count);
    let topology = TrinityConsensus::simulate_genesis_topology(&validators, sim_count, &entropy);
    tracing::info!(
        "Topology: resilience={:.4}, decentralization={:.4}",
        topology.resilience_score,
        topology.decentralization_index,
    );

    // 5. Build GenesisSeed for realm allocator
    let realm_configs: Vec<RealmConfig> = seed
        .realms
        .iter()
        .map(|r| RealmConfig {
            name: r.name.clone(),
            rail_type: parse_rail_type(&r.rail_type),
            runtime: parse_runtime_type(&r.runtime_type),
            initial_treasury_allocation: r.initial_treasury,
            agent_count: r.agents_per_realm,
            custom_params: HashMap::new(),
        })
        .collect();

    let invariants = vec![
        ConstitutionalInvariant {
            id: "max-inflation".into(),
            description: "15% annual inflation cap".into(),
            invariant_type: InvariantType::MaxInflationRate,
            threshold: 0.15,
        },
        ConstitutionalInvariant {
            id: "min-reserve".into(),
            description: "20% minimum reserve ratio".into(),
            invariant_type: InvariantType::MinReserveRatio,
            threshold: 0.20,
        },
        ConstitutionalInvariant {
            id: "max-agent-autonomy".into(),
            description: "No single agent > 5% governance weight".into(),
            invariant_type: InvariantType::MaxAgentAutonomy,
            threshold: 0.05,
        },
    ];

    let genesis_seed = GenesisSeed {
        protocol_name: seed.meta.name.clone(),
        protocol_version: seed.meta.version.clone(),
        initial_entropy: seed_hash.clone(),
        realms: realm_configs,
        validators: validators.clone(),
        constitutional_invariants: invariants,
        token_config: TokenGenesisConfig {
            core_supply: seed.tokenomics.core_supply,
            origin_supply: seed.tokenomics.origin_supply,
            core_emission_rate: seed.tokenomics.target_inflation,
            staking_reward_base: 0.08,
            rail_allocations: HashMap::new(),
        },
    };

    // 6. Allocate realms
    tracing::info!("Allocating realms...");
    let allocator = RealmAllocator::allocate(&genesis_seed, &topology, &entropy);

    // 7. Collect agent births
    let agent_births: Vec<AgentBirthRecord> = allocator
        .agent_births()
        .iter()
        .map(|cert| AgentBirthRecord {
            agent_id: cert.agent_id.clone(),
            name: cert.name.clone(),
            realm: cert.realm_id.0.clone(),
            lineage: cert.rail_type.agent_lineage().to_string(),
            dna_hash: cert.dna_hash.clone(),
        })
        .collect();
    tracing::info!("Birthed {} agents", agent_births.len());

    // 8. Token allocation
    let token_alloc = GenesisTokenAllocation::default_allocation();
    token_alloc.validate().map_err(|e| anyhow::anyhow!(e))?;

    // 9. Realm allocation results
    let realm_results: Vec<RealmAllocationResult> = allocator
        .realms()
        .iter()
        .map(|alloc| RealmAllocationResult {
            realm_name: alloc.realm_id.0.clone(),
            rail_type: format!("{:?}", alloc.rail_type),
            validator_count: alloc.validator_set.len() as u32,
            agent_count: alloc.agent_ids.len() as u32,
        })
        .collect();

    // 10. Constitutional invariants (human-readable)
    let invariant_strings = vec![
        "MaxInflation: 15% annual cap".to_string(),
        "MinStakingReward: 3% APY floor".to_string(),
        "AgentWeightCap: No single agent > 5% of governance weight".to_string(),
        "TreasuryReserve: 20% minimum reserve ratio".to_string(),
        "FinalityGuarantee: 2/3 + 1 validator threshold".to_string(),
        "HumanVetoRight: Constitutional amendments require human approval".to_string(),
    ];

    // 11. Genesis hash
    let genesis_time = seed
        .meta
        .genesis_time
        .clone()
        .unwrap_or_else(|| chrono::Utc::now().to_rfc3339());

    let mut genesis_hasher = Sha256::new();
    genesis_hasher.update(seed_hash.as_bytes());
    genesis_hasher.update(genesis_time.as_bytes());
    genesis_hasher.update(format!("{}", topology.resilience_score).as_bytes());
    let genesis_hash = hex::encode(genesis_hasher.finalize());

    Ok(CompiledGenesis {
        genesis_hash,
        chain_id: seed.meta.chain_id.clone(),
        genesis_time,
        network_config: seed.network.clone(),
        topology: TopologyResult {
            validator_count: seed.validators.count,
            simulations_run: sim_count,
            resilience_score: topology.resilience_score,
            decentralization_index: topology.decentralization_index,
        },
        realm_allocations: realm_results,
        token_allocation: token_alloc,
        agent_births,
        constitutional_invariants: invariant_strings,
        genesis_seed_hash: seed_hash,
    })
}

fn default_seed() -> GenesisSeedFile {
    GenesisSeedFile {
        meta: SeedMeta {
            name: "Genesis Sentience Protocol".to_string(),
            version: "0.1.0".to_string(),
            chain_id: "gsp-mainnet-1".to_string(),
            genesis_time: None,
        },
        network: NetworkConfig {
            block_time_ms: 2000,
            epoch_length: 1000,
            finality_threshold: 0.667,
            snowman_confidence: 20,
        },
        realms: vec![
            SeedRealmConfig {
                name: "Aureum".to_string(),
                rail_type: "finance".to_string(),
                runtime_type: "evm".to_string(),
                agents_per_realm: 5,
                initial_treasury: 1_000_000,
                description: "Financial sovereignty rail".to_string(),
            },
            SeedRealmConfig {
                name: "Lexicon".to_string(),
                rail_type: "governance".to_string(),
                runtime_type: "wasm".to_string(),
                agents_per_realm: 5,
                initial_treasury: 500_000,
                description: "Governance and constitutional rail".to_string(),
            },
            SeedRealmConfig {
                name: "Nova".to_string(),
                rail_type: "research".to_string(),
                runtime_type: "ai".to_string(),
                agents_per_realm: 5,
                initial_treasury: 750_000,
                description: "Research and knowledge rail".to_string(),
            },
            SeedRealmConfig {
                name: "Mercator".to_string(),
                rail_type: "trade".to_string(),
                runtime_type: "wasm".to_string(),
                agents_per_realm: 5,
                initial_treasury: 1_000_000,
                description: "Trade and commerce rail".to_string(),
            },
            SeedRealmConfig {
                name: "Ludos".to_string(),
                rail_type: "chaos".to_string(),
                runtime_type: "wasm".to_string(),
                agents_per_realm: 3,
                initial_treasury: 250_000,
                description: "Entropy and chaos rail".to_string(),
            },
        ],
        tokenomics: SeedTokenomics {
            core_supply: 1_000_000_000,
            origin_supply: 100_000_000,
            base_emission_per_epoch: 1_000_000,
            target_inflation: 0.05,
        },
        validators: SeedValidatorConfig {
            count: 100,
            min_stake: 100_000,
            topology_simulations: 1000,
        },
        agents: SeedAgentConfig {
            initial_agents_per_realm: 5,
            lineages: vec![
                "AURUM".to_string(),
                "LEXICON".to_string(),
                "NOVA".to_string(),
                "MERCATOR".to_string(),
                "LUDOS".to_string(),
            ],
        },
    }
}

fn main() -> Result<()> {
    tracing_subscriber::fmt::init();

    let cli = Cli::parse();

    match cli.command {
        Commands::Compile {
            seed_file,
            output,
            simulations,
        } => {
            tracing::info!("Loading seed from {:?}", seed_file);
            let seed_content =
                std::fs::read_to_string(&seed_file).context("Failed to read seed file")?;
            let seed: GenesisSeedFile =
                serde_yaml::from_str(&seed_content).context("Failed to parse seed YAML")?;

            let genesis = compile_genesis(&seed, simulations)?;

            let json = serde_json::to_string_pretty(&genesis)?;
            std::fs::write(&output, &json).context("Failed to write genesis JSON")?;

            println!("═══════════════════════════════════════════════");
            println!("  GENESIS SENTIENCE PROTOCOL — COMPILED");
            println!("═══════════════════════════════════════════════");
            println!("  Genesis Hash:    {}", &genesis.genesis_hash[..16]);
            println!("  Chain ID:        {}", genesis.chain_id);
            println!("  Seed Hash:       {}", &genesis.genesis_seed_hash[..16]);
            println!("  Validators:      {}", genesis.topology.validator_count);
            println!("  Realms:          {}", genesis.realm_allocations.len());
            println!("  Agents Birthed:  {}", genesis.agent_births.len());
            println!(
                "  Resilience:      {:.4}",
                genesis.topology.resilience_score
            );
            println!("  Output:          {:?}", output);
            println!("═══════════════════════════════════════════════");
        }

        Commands::Validate { seed_file } => {
            let seed_content =
                std::fs::read_to_string(&seed_file).context("Failed to read seed file")?;
            let seed: GenesisSeedFile =
                serde_yaml::from_str(&seed_content).context("Failed to parse seed YAML")?;

            let alloc = GenesisTokenAllocation::default_allocation();
            alloc.validate().map_err(|e| anyhow::anyhow!(e))?;

            println!("Seed file is valid");
            println!("  Name:       {}", seed.meta.name);
            println!("  Chain ID:   {}", seed.meta.chain_id);
            println!("  Realms:     {}", seed.realms.len());
            println!("  Validators: {}", seed.validators.count);
        }

        Commands::Template { output } => {
            let seed = default_seed();
            let yaml = serde_yaml::to_string(&seed)?;
            std::fs::write(&output, &yaml)?;
            println!("Template written to {:?}", output);
        }

        Commands::Inspect { genesis_file } => {
            let content =
                std::fs::read_to_string(&genesis_file).context("Failed to read genesis file")?;
            let genesis: CompiledGenesis =
                serde_json::from_str(&content).context("Failed to parse genesis JSON")?;

            println!("═══════════════════════════════════════════════");
            println!("  GENESIS STATE INSPECTION");
            println!("═══════════════════════════════════════════════");
            println!("  Genesis Hash:  {}", genesis.genesis_hash);
            println!("  Chain ID:      {}", genesis.chain_id);
            println!("  Time:          {}", genesis.genesis_time);
            println!();
            println!("  TOPOLOGY:");
            println!(
                "    Validators:     {}",
                genesis.topology.validator_count
            );
            println!(
                "    Resilience:     {:.4}",
                genesis.topology.resilience_score
            );
            println!(
                "    Decentralized:  {:.4}",
                genesis.topology.decentralization_index
            );
            println!();
            println!("  REALMS:");
            for r in &genesis.realm_allocations {
                println!(
                    "    {} ({}): {} validators, {} agents",
                    r.realm_name, r.rail_type, r.validator_count, r.agent_count
                );
            }
            println!();
            println!("  AGENTS: {} total", genesis.agent_births.len());
            println!();
            println!("  INVARIANTS:");
            for inv in &genesis.constitutional_invariants {
                println!("    - {}", inv);
            }
            println!("═══════════════════════════════════════════════");
        }
    }

    Ok(())
}
