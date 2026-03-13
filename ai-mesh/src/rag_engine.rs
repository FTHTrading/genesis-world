//! On-Chain RAG Engine
//!
//! Each realm contains:
//! - A Knowledge Merkle Tree
//! - IPFS/Arweave anchored document sets
//! - Vector embeddings stored via compressed zk commitments
//! - Snapshot hashes recorded per epoch
//!
//! AI queries knowledge → response proof hash → stored in block → auditable forever.

use gsp_kernel::{Epoch, RealmId};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::collections::HashMap;

/// A knowledge entry in the RAG system
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KnowledgeEntry {
    pub id: String,
    pub realm_id: RealmId,
    pub epoch_added: Epoch,
    pub content_hash: String,
    pub content_type: ContentType,
    pub storage_ref: StorageRef,
    pub embedding_hash: String,
    pub tags: Vec<String>,
    pub relevance_score: f64,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub enum ContentType {
    EconomicReport,
    GovernanceProposal,
    AgentDecision,
    EntropyEvent,
    TreasuryAction,
    ValidatorMetric,
    Constitutional,
    Historical,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum StorageRef {
    IPFS(String),
    Arweave(String),
    OnChain(String),
}

/// A RAG query result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RAGQueryResult {
    pub query_hash: String,
    pub entries: Vec<KnowledgeEntry>,
    pub response_summary: String,
    pub proof_hash: String,
    pub epoch: Epoch,
    pub querying_agent: String,
}

/// The RAG Engine
pub struct RAGEngine {
    knowledge_base: HashMap<String, KnowledgeEntry>,
    realm_indices: HashMap<RealmId, Vec<String>>,
    query_log: Vec<RAGQueryResult>,
    epoch_snapshots: HashMap<Epoch, String>, // epoch -> merkle root
}

impl RAGEngine {
    pub fn new() -> Self {
        Self {
            knowledge_base: HashMap::new(),
            realm_indices: HashMap::new(),
            query_log: Vec::new(),
            epoch_snapshots: HashMap::new(),
        }
    }

    /// Add knowledge entry
    pub fn add_knowledge(&mut self, entry: KnowledgeEntry) {
        let realm = entry.realm_id.clone();
        let id = entry.id.clone();
        self.knowledge_base.insert(id.clone(), entry);
        self.realm_indices
            .entry(realm)
            .or_insert_with(Vec::new)
            .push(id);
    }

    /// Query knowledge base by tags and realm
    pub fn query(
        &mut self,
        realm_id: &RealmId,
        tags: &[String],
        agent_id: &str,
        epoch: Epoch,
    ) -> RAGQueryResult {
        // Find matching entries
        let entries: Vec<KnowledgeEntry> = self
            .realm_indices
            .get(realm_id)
            .map(|ids| {
                ids.iter()
                    .filter_map(|id| self.knowledge_base.get(id))
                    .filter(|entry| {
                        tags.is_empty() || entry.tags.iter().any(|t| tags.contains(t))
                    })
                    .cloned()
                    .collect()
            })
            .unwrap_or_default();

        // Generate query hash
        let mut hasher = Sha256::new();
        hasher.update(realm_id.0.as_bytes());
        hasher.update(agent_id.as_bytes());
        hasher.update(epoch.to_le_bytes());
        for tag in tags {
            hasher.update(tag.as_bytes());
        }
        let query_hash = hex::encode(hasher.finalize());

        // Generate proof hash (hash of all returned content hashes)
        let mut proof_hasher = Sha256::new();
        proof_hasher.update(query_hash.as_bytes());
        for entry in &entries {
            proof_hasher.update(entry.content_hash.as_bytes());
        }
        let proof_hash = hex::encode(proof_hasher.finalize());

        let summary = format!(
            "Retrieved {} knowledge entries for realm '{}' matching tags {:?}",
            entries.len(),
            realm_id.0,
            tags
        );

        let result = RAGQueryResult {
            query_hash,
            entries,
            response_summary: summary,
            proof_hash,
            epoch,
            querying_agent: agent_id.to_string(),
        };

        self.query_log.push(result.clone());
        result
    }

    /// Query historical precedent — finds similar past events
    pub fn find_precedent(
        &mut self,
        realm_id: &RealmId,
        event_type: ContentType,
        agent_id: &str,
        epoch: Epoch,
    ) -> RAGQueryResult {
        let content_type_str = format!("{:?}", event_type);
        let entries: Vec<KnowledgeEntry> = self
            .knowledge_base
            .values()
            .filter(|e| {
                e.realm_id == *realm_id
                    && format!("{:?}", e.content_type) == content_type_str
                    && e.epoch_added < epoch
            })
            .cloned()
            .collect();

        let mut hasher = Sha256::new();
        hasher.update(b"precedent-query");
        hasher.update(realm_id.0.as_bytes());
        hasher.update(content_type_str.as_bytes());
        let query_hash = hex::encode(hasher.finalize());

        let mut proof_hasher = Sha256::new();
        proof_hasher.update(query_hash.as_bytes());
        for entry in &entries {
            proof_hasher.update(entry.content_hash.as_bytes());
        }
        let proof_hash = hex::encode(proof_hasher.finalize());

        let summary = if entries.is_empty() {
            "No historical precedent found".to_string()
        } else {
            format!(
                "Found {} precedent events. Most recent from epoch {}",
                entries.len(),
                entries.iter().map(|e| e.epoch_added).max().unwrap_or(0)
            )
        };

        let result = RAGQueryResult {
            query_hash,
            entries,
            response_summary: summary,
            proof_hash,
            epoch,
            querying_agent: agent_id.to_string(),
        };

        self.query_log.push(result.clone());
        result
    }

    /// Take epoch snapshot (merkle root of all knowledge)
    pub fn snapshot_epoch(&mut self, epoch: Epoch) -> String {
        let mut hasher = Sha256::new();
        hasher.update(epoch.to_le_bytes());
        let mut sorted_keys: Vec<&String> = self.knowledge_base.keys().collect();
        sorted_keys.sort();
        for key in sorted_keys {
            if let Some(entry) = self.knowledge_base.get(key) {
                hasher.update(entry.content_hash.as_bytes());
            }
        }
        let root = hex::encode(hasher.finalize());
        self.epoch_snapshots.insert(epoch, root.clone());
        root
    }

    pub fn total_knowledge(&self) -> usize {
        self.knowledge_base.len()
    }

    pub fn total_queries(&self) -> usize {
        self.query_log.len()
    }
}
