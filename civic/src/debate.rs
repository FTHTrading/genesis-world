//! Debate Graph — Merkle-anchored directed acyclic graph of civic discourse
//!
//! Every governance argument is a node. Edges encode causal/semantic
//! relationships: supports, contradicts, depends-on, supersedes.
//! Each epoch produces a Merkle root of the debate state.

use gsp_kernel::Epoch;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::collections::HashMap;

/// Relationship type between debate nodes
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum DebateRelation {
    /// This node supports (agrees with) the target
    Supports,
    /// This node contradicts (opposes) the target
    Contradicts,
    /// This node depends on the target
    DependsOn,
    /// This node supersedes (replaces) the target
    Supersedes,
}

impl DebateRelation {
    pub fn label(&self) -> &'static str {
        match self {
            Self::Supports => "SUPPORTS",
            Self::Contradicts => "CONTRADICTS",
            Self::DependsOn => "DEPENDS_ON",
            Self::Supersedes => "SUPERSEDES",
        }
    }

    /// Weight factor for debate scoring
    pub fn weight(&self) -> f64 {
        match self {
            Self::Supports => 1.0,
            Self::Contradicts => -1.0,
            Self::DependsOn => 0.5,
            Self::Supersedes => 0.0,
        }
    }
}

/// Type of content in a debate node
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum NodeKind {
    /// A testable claim or position
    Claim,
    /// Supporting or refuting evidence
    Evidence,
    /// A formal governance decision
    Decision,
    /// A constitutional reference
    Precedent,
}

/// A single node in the debate graph
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DebateNode {
    pub node_id: String,
    pub thread_id: String,
    pub kind: NodeKind,
    pub epoch: Epoch,
    pub author_id: String,
    pub content_hash: String,
    pub content_summary: String,
    pub confidence: f64,
    pub node_hash: String,
}

/// An edge connecting two debate nodes
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DebateEdge {
    pub from_node: String,
    pub to_node: String,
    pub relation: DebateRelation,
    pub epoch: Epoch,
    pub weight: f64,
}

/// Epoch-level Merkle root for the debate state
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EpochDebateRoot {
    pub epoch: Epoch,
    pub root_hash: String,
    pub node_count: usize,
    pub edge_count: usize,
}

/// The debate graph — maintains the full argument DAG
pub struct DebateGraph {
    nodes: Vec<DebateNode>,
    edges: Vec<DebateEdge>,
    node_index: HashMap<String, usize>,
    thread_nodes: HashMap<String, Vec<String>>,
    epoch_roots: Vec<EpochDebateRoot>,
}

impl DebateGraph {
    pub fn new() -> Self {
        Self {
            nodes: Vec::new(),
            edges: Vec::new(),
            node_index: HashMap::new(),
            thread_nodes: HashMap::new(),
            epoch_roots: Vec::new(),
        }
    }

    /// Add a claim, evidence, or decision node
    pub fn add_node(
        &mut self,
        thread_id: &str,
        kind: NodeKind,
        epoch: Epoch,
        author_id: &str,
        content_summary: &str,
        confidence: f64,
    ) -> &DebateNode {
        let content_hash = {
            let mut h = Sha256::new();
            h.update(content_summary.as_bytes());
            hex::encode(h.finalize())
        };

        let node_id = {
            let mut h = Sha256::new();
            h.update(thread_id.as_bytes());
            h.update(author_id.as_bytes());
            h.update(epoch.to_le_bytes());
            h.update(&content_hash);
            hex::encode(&h.finalize()[..12])
        };

        let node_hash = {
            let mut h = Sha256::new();
            h.update(node_id.as_bytes());
            h.update(&content_hash);
            h.update(epoch.to_le_bytes());
            hex::encode(h.finalize())
        };

        let node = DebateNode {
            node_id: node_id.clone(),
            thread_id: thread_id.to_string(),
            kind,
            epoch,
            author_id: author_id.to_string(),
            content_hash,
            content_summary: content_summary.to_string(),
            confidence: confidence.clamp(0.0, 1.0),
            node_hash,
        };

        let idx = self.nodes.len();
        self.node_index.insert(node_id.clone(), idx);
        self.thread_nodes
            .entry(thread_id.to_string())
            .or_default()
            .push(node_id);
        self.nodes.push(node);
        &self.nodes[idx]
    }

    /// Connect two nodes with a relation
    pub fn add_edge(
        &mut self,
        from_node: &str,
        to_node: &str,
        relation: DebateRelation,
        epoch: Epoch,
    ) -> Option<&DebateEdge> {
        // Validate both nodes exist
        if !self.node_index.contains_key(from_node) || !self.node_index.contains_key(to_node) {
            return None;
        }

        let edge = DebateEdge {
            from_node: from_node.to_string(),
            to_node: to_node.to_string(),
            relation,
            epoch,
            weight: relation.weight(),
        };

        self.edges.push(edge);
        Some(self.edges.last().unwrap())
    }

    /// Compute the Merkle root for the current epoch's debate state
    pub fn compute_epoch_root(&mut self, epoch: Epoch) -> EpochDebateRoot {
        // Collect all node hashes for this epoch
        let mut epoch_hashes: Vec<String> = self
            .nodes
            .iter()
            .filter(|n| n.epoch == epoch)
            .map(|n| n.node_hash.clone())
            .collect();

        // Include edge hashes
        for edge in self.edges.iter().filter(|e| e.epoch == epoch) {
            let mut h = Sha256::new();
            h.update(edge.from_node.as_bytes());
            h.update(edge.to_node.as_bytes());
            h.update(edge.relation.label().as_bytes());
            epoch_hashes.push(hex::encode(h.finalize()));
        }

        // Build Merkle root from collected hashes
        let root_hash = if epoch_hashes.is_empty() {
            hex::encode(Sha256::digest(b"empty_debate_epoch"))
        } else {
            Self::merkle_root(&epoch_hashes)
        };

        let node_count = self.nodes.iter().filter(|n| n.epoch == epoch).count();
        let edge_count = self.edges.iter().filter(|e| e.epoch == epoch).count();

        let root = EpochDebateRoot {
            epoch,
            root_hash,
            node_count,
            edge_count,
        };

        self.epoch_roots.push(root.clone());
        root
    }

    /// Simple Merkle root computation (binary tree hash)
    fn merkle_root(hashes: &[String]) -> String {
        if hashes.is_empty() {
            return hex::encode(Sha256::digest(b"empty"));
        }
        if hashes.len() == 1 {
            return hashes[0].clone();
        }

        let mut level: Vec<String> = hashes.to_vec();
        while level.len() > 1 {
            let mut next = Vec::new();
            for chunk in level.chunks(2) {
                let mut h = Sha256::new();
                h.update(chunk[0].as_bytes());
                if chunk.len() > 1 {
                    h.update(chunk[1].as_bytes());
                } else {
                    h.update(chunk[0].as_bytes()); // duplicate last
                }
                next.push(hex::encode(h.finalize()));
            }
            level = next;
        }
        level.into_iter().next().unwrap()
    }

    /// Get a node by ID
    pub fn get_node(&self, node_id: &str) -> Option<&DebateNode> {
        self.node_index.get(node_id).map(|&i| &self.nodes[i])
    }

    /// Get all nodes for a thread
    pub fn nodes_for_thread(&self, thread_id: &str) -> Vec<&DebateNode> {
        self.thread_nodes
            .get(thread_id)
            .map(|ids| {
                ids.iter()
                    .filter_map(|id| self.get_node(id))
                    .collect()
            })
            .unwrap_or_default()
    }

    /// Get edges from a node
    pub fn edges_from(&self, node_id: &str) -> Vec<&DebateEdge> {
        self.edges
            .iter()
            .filter(|e| e.from_node == node_id)
            .collect()
    }

    /// Get edges to a node
    pub fn edges_to(&self, node_id: &str) -> Vec<&DebateEdge> {
        self.edges
            .iter()
            .filter(|e| e.to_node == node_id)
            .collect()
    }

    /// Compute net support score for a node (sum of weighted edges pointing to it)
    pub fn support_score(&self, node_id: &str) -> f64 {
        self.edges_to(node_id)
            .iter()
            .map(|e| e.weight)
            .sum()
    }

    /// Get the latest epoch root
    pub fn latest_root(&self) -> Option<&EpochDebateRoot> {
        self.epoch_roots.last()
    }

    /// Total nodes in the graph
    pub fn total_nodes(&self) -> usize {
        self.nodes.len()
    }

    /// Total edges
    pub fn total_edges(&self) -> usize {
        self.edges.len()
    }
}
