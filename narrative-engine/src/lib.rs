//! Narrative Engine — The chain explains itself
//!
//! Transforms raw events into structured, proof-anchored narratives.
//! Every story has a cryptographic fingerprint. No black boxes.
//!
//! Components:
//! - Event indexer: raw events → story primitives
//! - Causal graph: maps cause → effect → delta → risk
//! - Narrative compiler: multi-layer story synthesis
//! - Proof anchor: cryptographic proof of every narrative

use gsp_kernel::{BlockHeight, Epoch, RealmId};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::collections::HashMap;

// ───── EVENT INDEXER ─────

/// Story primitives — atomic narrative units
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StoryPrimitive {
    pub id: String,
    pub epoch: Epoch,
    pub block_height: BlockHeight,
    pub primitive_type: PrimitiveType,
    pub agent_id: Option<String>,
    pub realm_id: Option<RealmId>,
    pub description: String,
    pub data: HashMap<String, String>,
    pub timestamp: i64,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum PrimitiveType {
    Action,
    Cause,
    Effect,
    Delta,
    RiskShift,
    IntentHash,
}

/// Event indexer transforms raw events into story primitives
pub struct EventIndexer {
    primitives: Vec<StoryPrimitive>,
    counter: u64,
}

impl EventIndexer {
    pub fn new() -> Self {
        Self {
            primitives: Vec::new(),
            counter: 0,
        }
    }

    pub fn index_event(
        &mut self,
        epoch: Epoch,
        block_height: BlockHeight,
        ptype: PrimitiveType,
        agent_id: Option<String>,
        realm_id: Option<RealmId>,
        description: &str,
        data: HashMap<String, String>,
    ) -> String {
        self.counter += 1;
        let id = format!("evt-{}-{}", epoch, self.counter);
        self.primitives.push(StoryPrimitive {
            id: id.clone(),
            epoch,
            block_height,
            primitive_type: ptype,
            agent_id,
            realm_id,
            description: description.to_string(),
            data,
            timestamp: chrono::Utc::now().timestamp(),
        });
        id
    }

    pub fn primitives_for_epoch(&self, epoch: Epoch) -> Vec<&StoryPrimitive> {
        self.primitives.iter().filter(|p| p.epoch == epoch).collect()
    }

    pub fn total_events(&self) -> usize {
        self.primitives.len()
    }
}

// ───── CAUSAL GRAPH ─────

/// A causal link between two events
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CausalEdge {
    pub cause_id: String,
    pub effect_id: String,
    pub relationship: CausalRelationship,
    pub strength: f64,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub enum CausalRelationship {
    DirectCause,
    Contributing,
    Trigger,
    Response,
    Consequence,
}

/// The causal graph DAG
pub struct CausalGraph {
    edges: Vec<CausalEdge>,
    nodes: HashMap<String, StoryPrimitive>,
}

impl CausalGraph {
    pub fn new() -> Self {
        Self {
            edges: Vec::new(),
            nodes: HashMap::new(),
        }
    }

    pub fn add_node(&mut self, primitive: StoryPrimitive) {
        self.nodes.insert(primitive.id.clone(), primitive);
    }

    pub fn add_edge(&mut self, cause_id: &str, effect_id: &str, rel: CausalRelationship, strength: f64) {
        self.edges.push(CausalEdge {
            cause_id: cause_id.to_string(),
            effect_id: effect_id.to_string(),
            relationship: rel,
            strength,
        });
    }

    /// Trace the causal chain for an event
    pub fn trace_causes(&self, event_id: &str) -> Vec<&CausalEdge> {
        self.edges.iter().filter(|e| e.effect_id == event_id).collect()
    }

    /// Trace the effects of an event
    pub fn trace_effects(&self, event_id: &str) -> Vec<&CausalEdge> {
        self.edges.iter().filter(|e| e.cause_id == event_id).collect()
    }

    /// Get full causal chain (recursive up to depth)
    pub fn full_chain(&self, event_id: &str, depth: usize) -> Vec<String> {
        let mut chain = vec![event_id.to_string()];
        if depth == 0 {
            return chain;
        }
        for edge in self.trace_causes(event_id) {
            chain.extend(self.full_chain(&edge.cause_id, depth - 1));
        }
        chain
    }
}

// ───── NARRATIVE COMPILER ─────

/// A compiled narrative — multi-level story
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CompiledNarrative {
    pub epoch: Epoch,
    pub realm_id: Option<RealmId>,
    pub level1_summary: String,
    pub level2_technical: String,
    pub level3_audit_hashes: Vec<String>,
    pub narrative_hash: String,
    pub data_root: String,
    pub causal_graph_root: String,
    pub agent_refs: Vec<String>,
    pub block_ref: BlockHeight,
}

/// The Narrative Compiler
pub struct NarrativeCompiler;

impl NarrativeCompiler {
    /// Compile a narrative from events
    pub fn compile(
        epoch: Epoch,
        realm_id: Option<RealmId>,
        events: &[StoryPrimitive],
        causal_edges: &[CausalEdge],
        block_height: BlockHeight,
    ) -> CompiledNarrative {
        // Level 1: Human-readable summary
        let action_count = events.iter().filter(|e| e.primitive_type == PrimitiveType::Action).count();
        let agents: Vec<String> = events
            .iter()
            .filter_map(|e| e.agent_id.clone())
            .collect::<std::collections::HashSet<_>>()
            .into_iter()
            .collect();

        let realm_name = realm_id
            .as_ref()
            .map(|r| r.0.as_str())
            .unwrap_or("Core Mesh");

        let level1 = format!(
            "Epoch {}: {} actions across {} agents in {}.",
            epoch, action_count, agents.len(), realm_name
        );

        // Level 2: Technical brief
        let effects: Vec<&StoryPrimitive> = events
            .iter()
            .filter(|e| e.primitive_type == PrimitiveType::Effect)
            .collect();

        let level2 = if effects.is_empty() {
            format!("Epoch {}: No significant effects recorded.", epoch)
        } else {
            let effect_descs: Vec<String> = effects.iter().map(|e| e.description.clone()).collect();
            format!(
                "Epoch {} technical summary: {} effects observed. {}",
                epoch,
                effects.len(),
                effect_descs.join("; ")
            )
        };

        // Level 3: Full audit hashes
        let audit_hashes: Vec<String> = events
            .iter()
            .map(|e| {
                let mut h = Sha256::new();
                h.update(e.id.as_bytes());
                h.update(e.description.as_bytes());
                hex::encode(h.finalize())
            })
            .collect();

        // Compute roots
        let mut data_hasher = Sha256::new();
        for h in &audit_hashes {
            data_hasher.update(h.as_bytes());
        }
        let data_root = hex::encode(data_hasher.finalize());

        let mut causal_hasher = Sha256::new();
        for edge in causal_edges {
            causal_hasher.update(edge.cause_id.as_bytes());
            causal_hasher.update(edge.effect_id.as_bytes());
        }
        let causal_root = hex::encode(causal_hasher.finalize());

        let mut narrative_hasher = Sha256::new();
        narrative_hasher.update(data_root.as_bytes());
        narrative_hasher.update(causal_root.as_bytes());
        narrative_hasher.update(level1.as_bytes());
        let narrative_hash = hex::encode(narrative_hasher.finalize());

        CompiledNarrative {
            epoch,
            realm_id,
            level1_summary: level1,
            level2_technical: level2,
            level3_audit_hashes: audit_hashes,
            narrative_hash,
            data_root,
            causal_graph_root: causal_root,
            agent_refs: agents,
            block_ref: block_height,
        }
    }
}
