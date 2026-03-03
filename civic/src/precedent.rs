//! Precedent Index — Historical decision archive with similarity search
//!
//! Every governance decision becomes a PrecedentRecord. Agents and humans
//! can query the index for semantically similar past decisions to inform
//! current proposals. This is the institutional memory of the civilization.

use gsp_kernel::Epoch;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::collections::HashMap;

/// Category of precedent
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum PrecedentCategory {
    /// Governance procedure
    Governance,
    /// Treasury allocation decision
    Treasury,
    /// Slashing / enforcement
    Enforcement,
    /// Realm creation / modification
    RealmPolicy,
    /// Constitutional amendment
    Constitutional,
    /// Agent behavior ruling
    AgentConduct,
    /// Emergency / incident response
    Emergency,
}

impl PrecedentCategory {
    pub fn label(&self) -> &'static str {
        match self {
            Self::Governance => "GOVERNANCE",
            Self::Treasury => "TREASURY",
            Self::Enforcement => "ENFORCEMENT",
            Self::RealmPolicy => "REALM_POLICY",
            Self::Constitutional => "CONSTITUTIONAL",
            Self::AgentConduct => "AGENT_CONDUCT",
            Self::Emergency => "EMERGENCY",
        }
    }
}

/// Outcome of a precedent-setting decision
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum PrecedentOutcome {
    Approved,
    Rejected,
    Modified,
    Deferred,
    Superseded,
}

/// A single precedent record
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PrecedentRecord {
    pub precedent_id: String,
    pub thread_id: String,
    pub category: PrecedentCategory,
    pub outcome: PrecedentOutcome,
    pub epoch: Epoch,
    pub title: String,
    pub summary: String,
    pub content_hash: String,
    /// Simplified keyword vector for similarity matching
    pub keywords: Vec<String>,
    /// Vote tally snapshot
    pub votes_for: u64,
    pub votes_against: u64,
    pub abstentions: u64,
    /// Impact assessment (0.0-1.0)
    pub impact_score: f64,
    /// Actors who co-authored the decision
    pub signatories: Vec<String>,
    /// References to prior precedents cited
    pub cites: Vec<String>,
    /// Hash chain link
    pub precedent_hash: String,
}

/// The precedent index — searchable archive of all governance decisions
pub struct PrecedentIndex {
    records: Vec<PrecedentRecord>,
    id_index: HashMap<String, usize>,
    category_index: HashMap<PrecedentCategory, Vec<String>>,
    epoch_index: HashMap<Epoch, Vec<String>>,
    keyword_index: HashMap<String, Vec<String>>,
    chain_head: String,
}

impl PrecedentIndex {
    pub fn new() -> Self {
        Self {
            records: Vec::new(),
            id_index: HashMap::new(),
            category_index: HashMap::new(),
            epoch_index: HashMap::new(),
            keyword_index: HashMap::new(),
            chain_head: hex::encode(Sha256::digest(b"genesis_precedent")),
        }
    }

    /// Record a new precedent
    pub fn record_precedent(
        &mut self,
        thread_id: &str,
        category: PrecedentCategory,
        outcome: PrecedentOutcome,
        epoch: Epoch,
        title: &str,
        summary: &str,
        keywords: Vec<String>,
        votes_for: u64,
        votes_against: u64,
        abstentions: u64,
        signatories: Vec<String>,
        cites: Vec<String>,
    ) -> &PrecedentRecord {
        let content_hash = {
            let mut h = Sha256::new();
            h.update(summary.as_bytes());
            hex::encode(h.finalize())
        };

        let precedent_id = {
            let mut h = Sha256::new();
            h.update(thread_id.as_bytes());
            h.update(epoch.to_le_bytes());
            h.update(&content_hash);
            hex::encode(&h.finalize()[..16])
        };

        // Chain the precedent hash
        let precedent_hash = {
            let mut h = Sha256::new();
            h.update(self.chain_head.as_bytes());
            h.update(precedent_id.as_bytes());
            h.update(&content_hash);
            h.update(epoch.to_le_bytes());
            hex::encode(h.finalize())
        };

        self.chain_head = precedent_hash.clone();

        let impact_score = Self::compute_impact(votes_for, votes_against, &category);

        let record = PrecedentRecord {
            precedent_id: precedent_id.clone(),
            thread_id: thread_id.to_string(),
            category,
            outcome,
            epoch,
            title: title.to_string(),
            summary: summary.to_string(),
            content_hash,
            keywords: keywords.clone(),
            votes_for,
            votes_against,
            abstentions,
            impact_score,
            signatories,
            cites,
            precedent_hash,
        };

        let idx = self.records.len();
        self.id_index.insert(precedent_id.clone(), idx);
        self.category_index
            .entry(category)
            .or_default()
            .push(precedent_id.clone());
        self.epoch_index
            .entry(epoch)
            .or_default()
            .push(precedent_id.clone());

        for kw in &keywords {
            self.keyword_index
                .entry(kw.to_lowercase())
                .or_default()
                .push(precedent_id.clone());
        }

        self.records.push(record);
        &self.records[idx]
    }

    /// Simple impact scoring
    fn compute_impact(votes_for: u64, votes_against: u64, category: &PrecedentCategory) -> f64 {
        let total = (votes_for + votes_against) as f64;
        if total == 0.0 {
            return 0.0;
        }

        let consensus_strength = (votes_for as f64 - votes_against as f64).abs() / total;
        let category_weight = match category {
            PrecedentCategory::Constitutional => 1.0,
            PrecedentCategory::Enforcement => 0.9,
            PrecedentCategory::Treasury => 0.8,
            PrecedentCategory::Governance => 0.7,
            PrecedentCategory::Emergency => 0.85,
            PrecedentCategory::RealmPolicy => 0.6,
            PrecedentCategory::AgentConduct => 0.5,
        };

        (consensus_strength * category_weight).clamp(0.0, 1.0)
    }

    /// Search for similar precedents by keyword overlap (top-K)
    pub fn search_similar(&self, query_keywords: &[String], top_k: usize) -> Vec<&PrecedentRecord> {
        let mut scores: HashMap<String, f64> = HashMap::new();

        for kw in query_keywords {
            let kw_lower = kw.to_lowercase();
            if let Some(ids) = self.keyword_index.get(&kw_lower) {
                for id in ids {
                    *scores.entry(id.clone()).or_insert(0.0) += 1.0;
                }
            }
        }

        // Boost by impact score
        for (id, score) in scores.iter_mut() {
            if let Some(record) = self.get(id) {
                *score *= 1.0 + record.impact_score;
            }
        }

        let mut ranked: Vec<(String, f64)> = scores.into_iter().collect();
        ranked.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap_or(std::cmp::Ordering::Equal));

        ranked
            .into_iter()
            .take(top_k)
            .filter_map(|(id, _)| self.get(&id))
            .collect()
    }

    /// Get a precedent by ID
    pub fn get(&self, precedent_id: &str) -> Option<&PrecedentRecord> {
        self.id_index
            .get(precedent_id)
            .map(|&i| &self.records[i])
    }

    /// Get all precedents for a category
    pub fn by_category(&self, category: PrecedentCategory) -> Vec<&PrecedentRecord> {
        self.category_index
            .get(&category)
            .map(|ids| {
                ids.iter()
                    .filter_map(|id| self.get(id))
                    .collect()
            })
            .unwrap_or_default()
    }

    /// Get all precedents for an epoch
    pub fn by_epoch(&self, epoch: Epoch) -> Vec<&PrecedentRecord> {
        self.epoch_index
            .get(&epoch)
            .map(|ids| {
                ids.iter()
                    .filter_map(|id| self.get(id))
                    .collect()
            })
            .unwrap_or_default()
    }

    /// Total recorded precedents
    pub fn total(&self) -> usize {
        self.records.len()
    }

    /// Get the chain head hash
    pub fn chain_head(&self) -> &str {
        &self.chain_head
    }
}
