//! Genesis Sentience Protocol — Civilization Simulator
//!
//! Boots a full civilization: genesis → agents → epochs → entropy → governance → narratives → civic.
//! This is the "Day One" demo — the chain explaining itself from block zero.
//!
//! Usage:
//!   gsp-demo                    # Terminal cinematic output
//!   gsp-demo --export report.json  # Also writes JSON report

use anyhow::Result;
use clap::Parser;
use gsp_kernel::{
    consensus::{ConsensusConfig, TrinityConsensus},
    entropy::EntropyEngine,
    realm_allocator::RealmAllocator,
    types::*,
};
use gsp_agents::{
    economics::AgentEconomics,
    identity::AgentIdentity,
};
use gsp_ai_mesh::{
    agent_registry::AgentRegistry,
    mcp::{MCPOrchestrator, ProposalType},
};
use gsp_civic::{
    threads::{ThreadRegistry, ThreadType, ThreadOrigin, ActorType, MessagePosition},
    hierarchy::{RoleRegistry, CivicRole, HierarchyActorType},
    debate::{DebateGraph, NodeKind, DebateRelation},
    precedent::{PrecedentIndex, PrecedentCategory, PrecedentOutcome},
    reputation::CivicReputationEngine,
};
use gsp_patron::{
    PatronConfig, PatronEngine, AgentEpochMetrics,
};
use gsp_narrative::{
    CausalGraph, CausalRelationship, CompiledNarrative, EventIndexer, NarrativeCompiler,
    PrimitiveType,
};
use gsp_tokenomics::{
    emission::{EmissionConfig, EmissionEngine},
    tokens::GenesisTokenAllocation,
};
use gsp_validator::staking::StakingEngine;
use serde::Serialize;
use std::collections::HashMap;

/// Genesis Sentience Protocol — Civilization Simulator
#[derive(Parser)]
#[command(name = "gsp-demo", version, about = "GSP Civilization Simulator — Day One")]
struct Cli {
    /// Export full epoch report as JSON
    #[arg(long, value_name = "FILE")]
    export: Option<String>,
}

const DEMO_EPOCHS: u64 = 10;
const DEMO_VALIDATORS: u32 = 25;
const DEMO_AGENTS_PER_REALM: u32 = 3;

// ───── JSON EXPORT STRUCTS ─────

#[derive(Serialize)]
struct CivilizationReport {
    protocol: String,
    version: String,
    validators: u32,
    realms: Vec<RealmReport>,
    agents: usize,
    epochs: Vec<EpochReport>,
    summary: SummaryReport,
    civic: CivicReport,
    patron: PatronReport,
}

#[derive(Serialize)]
struct RealmReport {
    name: String,
    rail: String,
    validators: usize,
    agents: usize,
}

#[derive(Serialize)]
struct EpochReport {
    epoch: u64,
    block_height: u64,
    proposer: String,
    entropy_mutations: usize,
    emission_total: u64,
    emission_burned: u64,
    staking_rewards: u64,
    inflation_rate: f64,
    agents_active: usize,
    governance_event: Option<String>,
    narrative_hash: String,
    narrative_summary: String,
    civic_threads_created: usize,
    debate_root: Option<String>,
    patron_pool: u64,
    patron_proof_root: String,
}

#[derive(Serialize)]
struct SummaryReport {
    total_staked: u64,
    validator_count: usize,
    active_agents: usize,
    total_net_value: i64,
    total_compute_spent: u64,
    total_events: usize,
    final_height: u64,
    final_epoch: u64,
    annual_inflation_rate: f64,
    last_narrative_hash: String,
}

#[derive(Serialize)]
struct CivicReport {
    total_threads: usize,
    total_debate_nodes: usize,
    total_debate_edges: usize,
    total_precedents: usize,
    reputation_actors: usize,
    debate_roots: Vec<String>,
    precedent_chain_head: String,
}

#[derive(Serialize)]
struct PatronReport {
    total_capital: u64,
    total_backers: usize,
    total_vaults: usize,
    leaderboard: Vec<PatronLeaderboardJson>,
    lifetime_pool_distributed: u64,
    final_proof_root: String,
}

#[derive(Serialize)]
struct PatronLeaderboardJson {
    account_id: String,
    total_deposited: u64,
    total_rewards: u64,
    agents_backed: usize,
    tier: String,
}

fn main() -> Result<()> {
    // Force UTF-8 console output on Windows (fixes box-drawing glyphs)
    #[cfg(windows)]
    unsafe {
        extern "system" {
            fn SetConsoleOutputCP(wCodePageID: u32) -> i32;
        }
        SetConsoleOutputCP(65001);
    }

    let cli = Cli::parse();

    tracing_subscriber::fmt()
        .with_max_level(tracing::Level::INFO)
        .init();

    println!();
    println!("╔═══════════════════════════════════════════════════════════════╗");
    println!("║     GENESIS SENTIENCE PROTOCOL — CIVILIZATION SIMULATOR      ║");
    println!("║                          Day One                             ║");
    println!("║                                                              ║");
    println!("║  \"The chain is alive. It explains itself.\"                   ║");
    println!("╚═══════════════════════════════════════════════════════════════╝");
    println!();

    // ═══════════════════════════════════════════════════════
    // PHASE 1: GENESIS
    // ═══════════════════════════════════════════════════════
    println!("┌─────────────────────────────────────────────────────────────┐");
    println!("│  PHASE 1: GENESIS COMPILATION                              │");
    println!("└─────────────────────────────────────────────────────────────┘");

    let entropy_seed = [42u8; 32];

    let validators: Vec<ValidatorConfig> = (0..DEMO_VALIDATORS)
        .map(|i| ValidatorConfig {
            id: format!("val-{:04}", i),
            stake: 100_000 + (i as u64 * 10_000),
            realms: vec![
                "aureum".into(),
                "lexicon".into(),
                "nova".into(),
                "mercator".into(),
                "ludos".into(),
            ],
            pubkey: format!("0x{:064x}", i),
        })
        .collect();

    let topology = TrinityConsensus::simulate_genesis_topology(&validators, 100, &entropy_seed);
    println!(
        "  ◈ Topology     │ {} validators, resilience={:.4}, decentralization={:.4}",
        topology.validators.len(),
        topology.resilience_score,
        topology.decentralization_index
    );

    let token_alloc = GenesisTokenAllocation::default_allocation();
    token_alloc.validate().map_err(|e| anyhow::anyhow!(e))?;
    println!("  ◈ Tokens       │ Allocation validated — 1B $CORE, 100M $ORIGIN");

    // ═══════════════════════════════════════════════════════
    // PHASE 2: REALM ALLOCATION
    // ═══════════════════════════════════════════════════════
    println!();
    println!("┌─────────────────────────────────────────────────────────────┐");
    println!("│  PHASE 2: REALM ALLOCATION                                 │");
    println!("└─────────────────────────────────────────────────────────────┘");

    let realm_configs = vec![
        RealmConfig {
            name: "Aureum".into(),
            rail_type: RailType::Finance,
            runtime: RuntimeType::EVM,
            initial_treasury_allocation: 1_000_000,
            agent_count: DEMO_AGENTS_PER_REALM,
            custom_params: HashMap::new(),
        },
        RealmConfig {
            name: "Lexicon".into(),
            rail_type: RailType::Governance,
            runtime: RuntimeType::WASM,
            initial_treasury_allocation: 500_000,
            agent_count: DEMO_AGENTS_PER_REALM,
            custom_params: HashMap::new(),
        },
        RealmConfig {
            name: "Nova".into(),
            rail_type: RailType::Research,
            runtime: RuntimeType::AIAssisted,
            initial_treasury_allocation: 750_000,
            agent_count: DEMO_AGENTS_PER_REALM,
            custom_params: HashMap::new(),
        },
        RealmConfig {
            name: "Mercator".into(),
            rail_type: RailType::Trade,
            runtime: RuntimeType::WASM,
            initial_treasury_allocation: 1_000_000,
            agent_count: DEMO_AGENTS_PER_REALM,
            custom_params: HashMap::new(),
        },
        RealmConfig {
            name: "Ludos".into(),
            rail_type: RailType::Chaos,
            runtime: RuntimeType::WASM,
            initial_treasury_allocation: 250_000,
            agent_count: DEMO_AGENTS_PER_REALM,
            custom_params: HashMap::new(),
        },
    ];

    let invariants = vec![ConstitutionalInvariant {
        id: "max-inflation".into(),
        description: "15% annual inflation cap".into(),
        invariant_type: InvariantType::MaxInflationRate,
        threshold: 0.15,
    }];

    let genesis_seed = GenesisSeed {
        protocol_name: "Genesis Sentience Protocol".into(),
        protocol_version: "0.1.0".into(),
        initial_entropy: "demo-entropy".into(),
        realms: realm_configs,
        validators: validators.clone(),
        constitutional_invariants: invariants.clone(),
        token_config: TokenGenesisConfig {
            core_supply: 1_000_000_000,
            origin_supply: 100_000_000,
            core_emission_rate: 0.05,
            staking_reward_base: 0.08,
            rail_allocations: HashMap::new(),
        },
    };

    let allocator = RealmAllocator::allocate(&genesis_seed, &topology, &entropy_seed);

    let mut all_agents: Vec<AgentIdentity> = Vec::new();
    let mut agent_econ: HashMap<String, AgentEconomics> = HashMap::new();
    let mut registry = AgentRegistry::new();
    let mut realm_reports: Vec<RealmReport> = Vec::new();

    for cert in allocator.agent_births() {
        let identity = AgentIdentity::from_birth(cert.clone());
        agent_econ.insert(
            cert.agent_id.clone(),
            AgentEconomics::new(cert.agent_id.clone(), 10_000, 5_000),
        );
        registry.register(cert.clone());
        all_agents.push(identity);
    }

    for alloc in allocator.realms() {
        println!(
            "  ◈ {:12} │ rail={:8} │ {} validators │ {} agents",
            alloc.realm_id.0,
            alloc.rail_type.token_symbol(),
            alloc.validator_set.len(),
            alloc.agent_ids.len()
        );
        realm_reports.push(RealmReport {
            name: alloc.realm_id.0.clone(),
            rail: alloc.rail_type.token_symbol().to_string(),
            validators: alloc.validator_set.len(),
            agents: alloc.agent_ids.len(),
        });
    }
    println!("  ◈ Total Agents │ {}", all_agents.len());

    // ═══════════════════════════════════════════════════════
    // PHASE 3: INFRASTRUCTURE BOOT
    // ═══════════════════════════════════════════════════════
    println!();
    println!("┌─────────────────────────────────────────────────────────────┐");
    println!("│  PHASE 3: INFRASTRUCTURE BOOT                              │");
    println!("└─────────────────────────────────────────────────────────────┘");

    let mut entropy_engine = EntropyEngine::new(entropy_seed, gsp_kernel::entropy::EntropyBounds::default());
    let mut emission_engine = EmissionEngine::new(EmissionConfig::default(), 1_000_000_000);
    let mut staking = StakingEngine::new(100, 10_000);
    let mut narrative_indexer = EventIndexer::new();
    let mut causal_graph = CausalGraph::new();
    let mut mcp = MCPOrchestrator::new(100, 0.8);

    // CIVIC infrastructure
    let mut thread_registry = ThreadRegistry::new();
    let mut role_registry = RoleRegistry::new();
    let mut debate_graph = DebateGraph::new();
    let mut precedent_index = PrecedentIndex::new();
    let mut reputation_engine = CivicReputationEngine::new();

    // PATRON infrastructure
    let mut patron_engine = PatronEngine::new(PatronConfig::default());

    // Initialize staking positions
    for v in &topology.validators {
        let _ = staking.stake_core(v.id.clone(), v.collateral, 0);
    }

    // Assign CIVIC roles to validators and agents
    for v in &topology.validators {
        role_registry.assign_role(
            &v.id.0,
            HierarchyActorType::Validator,
            CivicRole::Sentinel,
            0,
        );
        reputation_engine.get_or_create(&v.id.0, 0);
    }
    for agent in &all_agents {
        role_registry.assign_role(
            &agent.birth_certificate.agent_id,
            HierarchyActorType::Agent,
            CivicRole::Citizen,
            0,
        );
        reputation_engine.get_or_create(&agent.birth_certificate.agent_id, 0);
    }

    let mut consensus = TrinityConsensus::new(
        ConsensusConfig::default(),
        topology.validators.clone(),
        entropy_seed,
    );

    println!("  ◈ Consensus    │ TrinityConsensus engine ready");
    println!("  ◈ Staking      │ {} positions initialized", topology.validators.len());
    println!("  ◈ Narrative    │ EventIndexer + CausalGraph ready");
    println!("  ◈ CIVIC        │ ThreadRegistry + DebateGraph + PrecedentIndex ready");
    println!("  ◈ Reputation   │ {} actors tracked", reputation_engine.total_actors());

    // ── PATRON: Seed pseudo-patron accounts ──
    let patron_names = [
        "ATLAS", "MERIDIAN", "SOLACE", "VECTOR", "PRISM",
        "FLUX", "CIPHER", "EPOCH", "VERTEX", "ZENITH",
        "NEXUS", "DRIFT", "QUORUM", "BASTION", "CRUCIBLE",
    ];
    let mut patron_deposits: Vec<(String, String, u64)> = Vec::new();
    for (i, name) in patron_names.iter().enumerate() {
        let account_id = format!("patron-{}", name);
        // Distribute backers across agents with varying deposit sizes
        // Whales back high-risk agents, small backers spread evenly
        for agent in &all_agents {
            let aid = &agent.birth_certificate.agent_id;
            let risk = agent.birth_certificate.genetic_vector.risk_tolerance;
            // Deterministic deposit: patron index + risk affinity
            let deposit_base = match i % 5 {
                0 => 100_000u64, // Architect-tier whale
                1 => 50_000,     // Strategist
                2 => 15_000,     // Patron
                3 => 3_000,      // Supporter
                _ => 1_000,      // Supporter-lite
            };
            // Only back agents whose risk profile matches — top-half of patrons bias toward high risk
            let risk_match = if i < patron_names.len() / 2 { risk > 0.3 } else { risk <= 0.7 };
            if risk_match {
                let amount = deposit_base + (risk * 1000.0) as u64;
                patron_deposits.push((account_id.clone(), aid.clone(), amount));
            }
        }
    }
    for (account, agent, amount) in &patron_deposits {
        let _ = patron_engine.deposit(account, agent, *amount, 0);
    }
    println!("  ◈ PATRON       │ {} backers, {} deposits, {} $CORE deployed",
        patron_engine.total_backers(),
        patron_deposits.len(),
        patron_engine.total_capital());

    // Create genesis constitutional thread
    thread_registry.create_thread(
        ThreadType::ConstitutionalReview,
        RealmId("genesis".into()),
        RailType::Governance,
        0,
        ThreadOrigin { actor_type: ActorType::System, actor_id: "genesis".into() },
        "Genesis Constitutional Compact",
        "The Genesis Sentience Protocol is founded on the following invariants: max 15% annual inflation, no agent may hold >5% of supply, constitutional changes require 67% supermajority.",
        None,
    );

    // ═══════════════════════════════════════════════════════
    // PHASE 4: EPOCH SIMULATION
    // ═══════════════════════════════════════════════════════
    println!();
    println!("┌─────────────────────────────────────────────────────────────┐");
    println!("│  PHASE 4: EPOCH SIMULATION — {} Epochs{:>25}│",
        DEMO_EPOCHS, " ");
    println!("└─────────────────────────────────────────────────────────────┘");

    let mut compiled_narratives: Vec<CompiledNarrative> = Vec::new();
    let mut epoch_reports: Vec<EpochReport> = Vec::new();

    for epoch in 0..DEMO_EPOCHS {
        // ── Entropy injection ──
        let validator_sigs: Vec<Hash256> = topology
            .validators
            .iter()
            .map(|v| {
                let mut sig = [0u8; 32];
                let id_bytes = v.id.0.as_bytes();
                let len = id_bytes.len().min(32);
                sig[..len].copy_from_slice(&id_bytes[..len]);
                sig
            })
            .collect();
        let mut val_nodes = topology.validators.clone();
        let injection = entropy_engine.inject_entropy(epoch, &validator_sigs, &mut val_nodes);

        let eid_entropy = narrative_indexer.index_event(
            epoch,
            epoch * 1000,
            PrimitiveType::Action,
            None,
            None,
            &format!("Entropy injection: {} weight mutations", injection.validator_weight_mutations.len()),
            HashMap::new(),
        );

        // ── Block production ──
        let block = consensus.produce_block(None);

        let eid_block = narrative_indexer.index_event(
            epoch,
            block.height,
            PrimitiveType::Action,
            None,
            None,
            &format!("Block {} produced by {}", block.height, block.proposer.0),
            HashMap::new(),
        );

        causal_graph.add_edge(&eid_entropy, &eid_block, CausalRelationship::Trigger, 0.8);

        // ── Emission ──
        let emission = emission_engine.calculate_epoch_emission(
            epoch,
            10_000,
            staking.total_staked(),
            None,
        );
        staking.distribute_rewards(emission.staking_rewards);

        let eid_emission = narrative_indexer.index_event(
            epoch,
            block.height,
            PrimitiveType::Effect,
            None,
            None,
            &format!(
                "Emission: {} total, {} to stakers, {} burned",
                emission.core_emitted, emission.staking_rewards, emission.core_burned
            ),
            HashMap::new(),
        );

        causal_graph.add_edge(&eid_block, &eid_emission, CausalRelationship::DirectCause, 1.0);

        // ── Agent activity ──
        let mut epoch_agent_events = Vec::new();
        for (i, agent) in all_agents.iter_mut().enumerate() {
            if i % 3 == (epoch as usize % 3) {
                let aid = &agent.birth_certificate.agent_id;
                if let Some(econ) = agent_econ.get_mut(aid) {
                    let _ = econ.pay_compute(50, epoch, "compute task");
                    econ.receive_reward(80 + (epoch * 10) as u64, epoch);
                }

                let eid_agent = narrative_indexer.index_event(
                    epoch,
                    block.height,
                    PrimitiveType::Action,
                    Some(aid.clone()),
                    Some(agent.birth_certificate.realm_id.clone()),
                    &format!("Agent {} performed compute task", aid),
                    HashMap::new(),
                );

                causal_graph.add_edge(&eid_block, &eid_agent, CausalRelationship::Contributing, 0.5);
                epoch_agent_events.push(eid_agent);

                // CIVIC: reputation update for agent activity
                reputation_engine.record_debate_participation(aid, epoch, 0.6);
            }
        }

        // ── Governance proposals every 3 epochs ──
        let mut gov_event: Option<String> = None;
        let mut epoch_threads_created: usize = 0;

        if epoch % 3 == 0 && epoch > 0 {
            let proposer_id = format!("agent-{}", epoch);
            let _proposal = mcp.submit_proposal(
                epoch,
                &proposer_id,
                ProposalType::InflationAdjustment,
                &format!("Epoch {} parameter adjustment", epoch),
                HashMap::from([("inflation_rate".to_string(), 0.04)]),
                &invariants,
            );

            // CIVIC: Create PROPOSAL thread
            let proposal_thread = thread_registry.create_thread(
                ThreadType::Proposal,
                RealmId("lexicon".into()),
                RailType::Governance,
                epoch,
                ThreadOrigin { actor_type: ActorType::Agent, actor_id: proposer_id.clone() },
                &format!("Epoch {} Inflation Adjustment Proposal", epoch),
                &format!("Proposing inflation rate adjustment to 4% at epoch {}. Current emission model requires recalibration based on staking ratio.", epoch),
                None,
            );

            // CIVIC: Add debate nodes for the proposal
            let claim_node = debate_graph.add_node(
                &proposal_thread.thread_id,
                NodeKind::Claim,
                epoch,
                &proposer_id,
                &format!("Inflation should be adjusted to 4% at epoch {}", epoch),
                0.75,
            );
            let claim_id = claim_node.node_id.clone();

            // Add supporting evidence
            let evidence_node = debate_graph.add_node(
                &proposal_thread.thread_id,
                NodeKind::Evidence,
                epoch,
                &format!("val-{:04}", epoch % DEMO_VALIDATORS as u64),
                "Staking ratio analysis supports proposed adjustment",
                0.80,
            );
            let evidence_id = evidence_node.node_id.clone();

            debate_graph.add_edge(&evidence_id, &claim_id, DebateRelation::Supports, epoch);

            // Add a dissenting message
            thread_registry.add_message(
                &proposal_thread.thread_id,
                ThreadOrigin { actor_type: ActorType::Validator, actor_id: format!("val-{:04}", (epoch + 1) % DEMO_VALIDATORS as u64) },
                epoch,
                "Counter-evidence suggests 3.5% would be more stable",
                MessagePosition::Oppose,
            );

            // Record precedent
            precedent_index.record_precedent(
                &proposal_thread.thread_id,
                PrecedentCategory::Governance,
                PrecedentOutcome::Approved,
                epoch,
                &format!("Epoch {} Inflation Adjustment", epoch),
                &format!("Inflation adjusted to 4% at epoch {} following staking ratio analysis", epoch),
                vec!["inflation".into(), "adjustment".into(), "staking".into(), "emission".into()],
                20, 5, 3,
                vec![proposer_id.clone()],
                Vec::new(),
            );

            reputation_engine.record_proposal_accepted(&proposer_id, epoch);

            epoch_threads_created += 1;
            gov_event = Some(format!("PROPOSAL: Epoch {} inflation adjustment → APPROVED (20-5-3)", epoch));

            let eid_gov = narrative_indexer.index_event(
                epoch,
                block.height,
                PrimitiveType::Action,
                None,
                None,
                &format!("Governance proposal submitted: Epoch {} adjustment", epoch),
                HashMap::new(),
            );

            let eid_risk = narrative_indexer.index_event(
                epoch,
                block.height,
                PrimitiveType::RiskShift,
                None,
                None,
                "Governance action introduces parameter change risk",
                HashMap::new(),
            );

            causal_graph.add_edge(&eid_gov, &eid_risk, CausalRelationship::Consequence, 0.6);
        }

        // ── CIVIC: Create EPOCH_RECAP thread ──
        let recap_thread = thread_registry.create_thread(
            ThreadType::EpochRecap,
            RealmId("genesis".into()),
            RailType::Governance,
            epoch,
            ThreadOrigin { actor_type: ActorType::System, actor_id: "narrative-engine".into() },
            &format!("Epoch {} Civilization Recap", epoch),
            &format!("Epoch {} processed: {} agents active, {} $CORE emitted, {} burned. Entropy injection performed with {} weight mutations.",
                epoch, epoch_agent_events.len(), emission.core_emitted, emission.core_burned, injection.validator_weight_mutations.len()),
            None,
        );
        epoch_threads_created += 1;

        // CIVIC: Compute debate root for this epoch
        let debate_root = debate_graph.compute_epoch_root(epoch);

        // ── PATRON: Score agents and settle epoch ──
        let agent_metrics: Vec<AgentEpochMetrics> = all_agents.iter().map(|a| {
            let aid = &a.birth_certificate.agent_id;
            let risk = a.birth_certificate.genetic_vector.risk_tolerance;
            let gov = a.birth_certificate.genetic_vector.governance_alignment;
            // Deterministic pseudo-metrics derived from agent DNA + epoch
            let treasury_delta = (200.0 + risk * 300.0 - (epoch as f64 * 10.0 * (1.0 - gov))) as i64;
            let volatility = (50.0 + risk * 200.0 + epoch as f64 * 5.0) as u64;
            let invariant = (1.0 - gov) * 0.1 * (epoch as f64 / DEMO_EPOCHS as f64);
            let proposal_rate = gov * 0.8 + 0.1;
            AgentEpochMetrics {
                agent_id: aid.clone(),
                treasury_delta_bps: treasury_delta,
                volatility_bps: volatility,
                invariant_pressure: invariant,
                proposal_success_rate: proposal_rate,
            }
        }).collect();
        patron_engine.set_scores(&agent_metrics);
        let patron_settlement = patron_engine.settle_epoch(epoch, emission.core_emitted);

        // ── Compile epoch narrative ──
        let epoch_events = narrative_indexer.primitives_for_epoch(epoch);
        let epoch_prims: Vec<gsp_narrative::StoryPrimitive> =
            epoch_events.iter().map(|e| (*e).clone()).collect();

        let narrative = NarrativeCompiler::compile(epoch, None, &epoch_prims, &[], block.height);

        // ── CINEMATIC EPOCH OUTPUT ──
        println!();
        println!("  ┌── EPOCH {:>2} ──────────────────────────────────────────────┐", epoch);
        println!("  │  Block        │ #{:<8} proposer: {:<20}│",
            block.height, &block.proposer.0);
        println!("  │  Entropy      │ {} mutations, hash: {}..  │",
            injection.validator_weight_mutations.len(),
            &hex::encode(&injection.entropy_hash[..6]));
        println!("  │  Emission     │ {} total, {} burned, {:.4}% infl  │",
            emission.core_emitted, emission.core_burned, emission.effective_inflation_rate * 100.0);
        println!("  │  Staking      │ {} rewards to {} validators{:>8}│",
            emission.staking_rewards, staking.validator_count(), " ");
        println!("  │  Agents       │ {} active this epoch{:>22}│",
            epoch_agent_events.len(), " ");

        if let Some(ref gov) = gov_event {
            println!("  │  Governance   │ {:<42}│", &gov[..gov.len().min(42)]);
        }

        println!("  │  CIVIC        │ {} threads, debate nodes={}, edges={}{}│",
            epoch_threads_created,
            debate_root.node_count,
            debate_root.edge_count,
            " ".repeat(4.max(1)));
        println!("  │  PATRON       │ pool={} $CORE, {} agents scored{:>10}│",
            patron_settlement.total_pool,
            patron_settlement.agent_scores.len(),
            " ");
        println!("  │  Narrative    │ {:<42}│",
            &narrative.level1_summary[..narrative.level1_summary.len().min(42)]);
        println!("  │  Debate Root  │ {}..{}│",
            &debate_root.root_hash[..32],
            " ".repeat(9));
        println!("  │  Recap Thread │ {:<42}│",
            &recap_thread.thread_id[..recap_thread.thread_id.len().min(42)]);
        println!("  └─────────────────────────────────────────────────────────┘");

        epoch_reports.push(EpochReport {
            epoch,
            block_height: block.height,
            proposer: block.proposer.0.clone(),
            entropy_mutations: injection.validator_weight_mutations.len(),
            emission_total: emission.core_emitted,
            emission_burned: emission.core_burned,
            staking_rewards: emission.staking_rewards,
            inflation_rate: emission.effective_inflation_rate,
            agents_active: epoch_agent_events.len(),
            governance_event: gov_event,
            narrative_hash: narrative.narrative_hash.clone(),
            narrative_summary: narrative.level1_summary.clone(),
            civic_threads_created: epoch_threads_created,
            debate_root: Some(debate_root.root_hash.clone()),
            patron_pool: patron_settlement.total_pool,
            patron_proof_root: patron_settlement.proof_roots.combined_root.clone(),
        });

        compiled_narratives.push(narrative);
    }

    // ═══════════════════════════════════════════════════════
    // PHASE 5: CIVILIZATION REPORT
    // ═══════════════════════════════════════════════════════
    println!();
    println!("┌─────────────────────────────────────────────────────────────┐");
    println!("│  PHASE 5: CIVILIZATION REPORT                              │");
    println!("└─────────────────────────────────────────────────────────────┘");

    let total_net_value: i64 = agent_econ.values().map(|e| e.net_value()).sum();
    let active_agents = agent_econ.values().filter(|e| e.total_rewards > 0).count();
    let total_compute_spent: u64 = agent_econ.values().map(|e| e.total_compute_spent).sum();

    println!("  ┌── Agents ────────────────────────────────────────────────┐");
    println!("  │  Total:              {:<39}│", all_agents.len());
    println!("  │  Active:             {:<39}│", active_agents);
    println!("  │  Net Value:          {:<39}│", total_net_value);
    println!("  │  Compute Spent:      {:<39}│", total_compute_spent);
    println!("  └──────────────────────────────────────────────────────────┘");

    println!("  ┌── Narratives ────────────────────────────────────────────┐");
    println!("  │  Compiled:           {:<39}│", compiled_narratives.len());
    println!("  │  Total Events:       {:<39}│", narrative_indexer.total_events());
    println!("  └──────────────────────────────────────────────────────────┘");

    println!("  ┌── Staking & Emission ────────────────────────────────────┐");
    println!("  │  Total Staked:       {:<39}│", staking.total_staked());
    println!("  │  Validators:         {:<39}│", staking.validator_count());
    println!("  │  Annual Inflation:   {:<39.4}│", emission_engine.annual_inflation_rate(DEMO_EPOCHS) * 100.0);
    println!("  └──────────────────────────────────────────────────────────┘");

    println!("  ┌── Consensus ─────────────────────────────────────────────┐");
    println!("  │  Height:             {:<39}│", consensus.current_height());
    println!("  │  Epoch:              {:<39}│", consensus.current_epoch());
    println!("  └──────────────────────────────────────────────────────────┘");

    // CIVIC summary
    let debate_roots: Vec<String> = epoch_reports
        .iter()
        .filter_map(|e| e.debate_root.clone())
        .collect();

    println!("  ┌── CIVIC Layer ───────────────────────────────────────────┐");
    println!("  │  Total Threads:      {:<39}│", thread_registry.total_threads());
    println!("  │  Total Messages:     {:<39}│", thread_registry.total_messages());
    println!("  │  Debate Nodes:       {:<39}│", debate_graph.total_nodes());
    println!("  │  Debate Edges:       {:<39}│", debate_graph.total_edges());
    println!("  │  Precedents:         {:<39}│", precedent_index.total());
    println!("  │  Reputation Actors:  {:<39}│", reputation_engine.total_actors());
    println!("  │  Precedent Chain:    {}..│", &precedent_index.chain_head()[..40]);
    println!("  └──────────────────────────────────────────────────────────┘");

    // PATRON leaderboard
    let leaderboard = patron_engine.leaderboard();
    println!("  ┌── PATRON Leaderboard ────────────────────────────────────┐");
    println!("  │  Total Capital:      {:<39}│", patron_engine.total_capital());
    println!("  │  Total Backers:      {:<39}│", patron_engine.total_backers());
    println!("  │  Active Vaults:      {:<39}│", patron_engine.total_vaults());
    println!("  │  Settlements:        {:<39}│", patron_engine.settlement_history.len());
    println!("  │{:─>62}│", "");
    for (i, entry) in leaderboard.iter().take(10).enumerate() {
        println!("  │  #{:<2} {:<12} │ {:>10} $CORE │ {:>8} rwds │ {:<10}│",
            i + 1,
            &entry.account_id[..entry.account_id.len().min(12)],
            entry.total_deposited,
            entry.total_rewards,
            entry.tier.label());
    }
    let patron_roots = patron_engine.compute_roots();
    println!("  │  Proof Root:  {}..│", &patron_roots.combined_root[..40]);
    println!("  └──────────────────────────────────────────────────────────┘");

    // Precedent search demo
    let similar = precedent_index.search_similar(
        &["inflation".into(), "staking".into()],
        3,
    );
    if !similar.is_empty() {
        println!();
        println!("  ◈ Precedent search for [inflation, staking]: {} results", similar.len());
        for p in &similar {
            println!("    → {} (epoch {}, impact={:.2})", p.title, p.epoch, p.impact_score);
        }
    }

    if let Some(last) = compiled_narratives.last() {
        println!();
        println!("  ◈ Last Narrative Hash: {}", &last.narrative_hash[..32]);
    }

    println!();
    println!("╔═══════════════════════════════════════════════════════════════╗");
    println!("║              GENESIS CIVILIZATION BOOTED                      ║");
    println!("║                                                               ║");
    println!("║  {} epochs │ {} events │ {} threads │ {} precedents{:>11}║",
        DEMO_EPOCHS,
        narrative_indexer.total_events(),
        thread_registry.total_threads(),
        precedent_index.total(),
        " ");
    println!("║  {} backers │ {} $CORE deployed │ {} vaults{:>18}║",
        patron_engine.total_backers(),
        patron_engine.total_capital(),
        patron_engine.total_vaults(),
        " ");
    println!("║                                                               ║");
    println!("║  \"The chain is alive. It governs itself. It remembers.\"       ║");
    println!("╚═══════════════════════════════════════════════════════════════╝");
    println!();

    // ═══════════════════════════════════════════════════════
    // JSON EXPORT
    // ═══════════════════════════════════════════════════════
    if let Some(ref export_path) = cli.export {
        let last_hash = compiled_narratives
            .last()
            .map(|n| n.narrative_hash.clone())
            .unwrap_or_default();

        let report = CivilizationReport {
            protocol: "Genesis Sentience Protocol".into(),
            version: "0.1.0".into(),
            validators: DEMO_VALIDATORS,
            realms: realm_reports,
            agents: all_agents.len(),
            epochs: epoch_reports,
            summary: SummaryReport {
                total_staked: staking.total_staked(),
                validator_count: staking.validator_count(),
                active_agents,
                total_net_value,
                total_compute_spent,
                total_events: narrative_indexer.total_events(),
                final_height: consensus.current_height(),
                final_epoch: consensus.current_epoch(),
                annual_inflation_rate: emission_engine.annual_inflation_rate(DEMO_EPOCHS),
                last_narrative_hash: last_hash,
            },
            civic: CivicReport {
                total_threads: thread_registry.total_threads(),
                total_debate_nodes: debate_graph.total_nodes(),
                total_debate_edges: debate_graph.total_edges(),
                total_precedents: precedent_index.total(),
                reputation_actors: reputation_engine.total_actors(),
                debate_roots,
                precedent_chain_head: precedent_index.chain_head().to_string(),
            },
            patron: {
                let lb = patron_engine.leaderboard();
                let lifetime_pool: u64 = patron_engine.settlement_history.iter()
                    .map(|s| s.total_pool).sum();
                let final_roots = patron_engine.compute_roots();
                PatronReport {
                    total_capital: patron_engine.total_capital(),
                    total_backers: patron_engine.total_backers(),
                    total_vaults: patron_engine.total_vaults(),
                    leaderboard: lb.iter().map(|e| PatronLeaderboardJson {
                        account_id: e.account_id.clone(),
                        total_deposited: e.total_deposited,
                        total_rewards: e.total_rewards,
                        agents_backed: e.agents_backed,
                        tier: e.tier.label().to_string(),
                    }).collect(),
                    lifetime_pool_distributed: lifetime_pool,
                    final_proof_root: final_roots.combined_root,
                }
            },
        };

        let json = serde_json::to_string_pretty(&report)?;
        std::fs::write(export_path, &json)?;
        println!("  ◈ Report exported to: {}", export_path);
        println!();
    }

    Ok(())
}
