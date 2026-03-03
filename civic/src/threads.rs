//! Thread Registry — Structured civic threads with lifecycle and proof anchoring
//!
//! Everything in CIVIC is a typed thread with required metadata.
//! Thread content can be mirrored anywhere, but only the chain-anchored
//! `content_hash` is canonical.

use gsp_kernel::{Epoch, RailType, RealmId};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::collections::HashMap;

/// Thread type classification
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum ThreadType {
    /// Governance change proposal
    Proposal,
    /// Treasury allocation, yield, reserves
    Treasury,
    /// Security incident, downtime, slashing
    Incident,
    /// Official epoch narrative summary
    EpochRecap,
    /// Agent decision contested
    Appeal,
    /// Grant, experiment, model evaluation
    Research,
    /// New realm creation request
    RealmRequest,
    /// Hard invariant discussion
    ConstitutionalReview,
}

impl ThreadType {
    pub fn label(&self) -> &'static str {
        match self {
            Self::Proposal => "PROPOSAL",
            Self::Treasury => "TREASURY",
            Self::Incident => "INCIDENT",
            Self::EpochRecap => "EPOCH_RECAP",
            Self::Appeal => "APPEAL",
            Self::Research => "RESEARCH",
            Self::RealmRequest => "REALM_REQUEST",
            Self::ConstitutionalReview => "CONSTITUTIONAL_REVIEW",
        }
    }
}

/// Thread lifecycle stage
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum ThreadStage {
    Open,
    Review,
    Voting,
    Executed,
    Rejected,
    Archived,
}

/// Who originated the thread
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum ActorType {
    Agent,
    Human,
    Validator,
    System,
}

/// Thread origin information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ThreadOrigin {
    pub actor_type: ActorType,
    pub actor_id: String,
}

/// Content reference (off-chain with on-chain hash)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ContentRef {
    /// Off-chain URI (IPFS, Arweave, etc.)
    pub uri: String,
    /// SHA-256 hash of the content
    pub content_hash: String,
}

/// A participant in a thread
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ThreadParticipant {
    pub role: String,
    pub actor_id: String,
    pub actor_type: ActorType,
}

/// Proof anchoring data
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ThreadProof {
    pub thread_root: String,
    pub signatures: Vec<ThreadSignature>,
}

/// Actor signature on a thread
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ThreadSignature {
    pub actor_id: String,
    pub signature: String,
    pub epoch: Epoch,
}

/// A canonical civic thread
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CivicThread {
    pub thread_id: String,
    pub thread_type: ThreadType,
    pub realm_id: RealmId,
    pub rail: RailType,
    pub epoch: Epoch,
    pub origin: ThreadOrigin,
    pub title: String,
    pub content_ref: ContentRef,
    pub participants: Vec<ThreadParticipant>,
    pub causal_refs: Vec<String>,
    pub proposal_ref: Option<String>,
    pub stage: ThreadStage,
    pub proof: ThreadProof,
    pub metadata: HashMap<String, String>,
}

/// A message within a thread (for debate tracking)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ThreadMessage {
    pub message_id: String,
    pub thread_id: String,
    pub author: ThreadOrigin,
    pub epoch: Epoch,
    pub content_hash: String,
    pub content_summary: String,
    pub position: MessagePosition,
    pub references: Vec<String>,
}

/// Position taken in a message
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum MessagePosition {
    Support,
    Oppose,
    Amend,
    Neutral,
    Evidence,
}

/// The thread registry — manages all civic threads
pub struct ThreadRegistry {
    threads: Vec<CivicThread>,
    messages: Vec<ThreadMessage>,
    thread_index: HashMap<String, usize>,
    realm_index: HashMap<RealmId, Vec<String>>,
    epoch_index: HashMap<Epoch, Vec<String>>,
}

impl ThreadRegistry {
    pub fn new() -> Self {
        Self {
            threads: Vec::new(),
            messages: Vec::new(),
            thread_index: HashMap::new(),
            realm_index: HashMap::new(),
            epoch_index: HashMap::new(),
        }
    }

    /// Create a new civic thread
    pub fn create_thread(
        &mut self,
        thread_type: ThreadType,
        realm_id: RealmId,
        rail: RailType,
        epoch: Epoch,
        origin: ThreadOrigin,
        title: &str,
        content_body: &str,
        proposal_ref: Option<String>,
    ) -> CivicThread {
        // Generate thread ID
        let mut hasher = Sha256::new();
        hasher.update(realm_id.0.as_bytes());
        hasher.update(epoch.to_le_bytes());
        hasher.update(title.as_bytes());
        hasher.update(origin.actor_id.as_bytes());
        let thread_id = hex::encode(&hasher.finalize()[..16]);

        // Hash the content
        let content_hash = {
            let mut h = Sha256::new();
            h.update(content_body.as_bytes());
            hex::encode(h.finalize())
        };

        // Generate thread root proof
        let thread_root = {
            let mut h = Sha256::new();
            h.update(thread_id.as_bytes());
            h.update(&content_hash);
            h.update(epoch.to_le_bytes());
            hex::encode(h.finalize())
        };

        let thread = CivicThread {
            thread_id: thread_id.clone(),
            thread_type,
            realm_id: realm_id.clone(),
            rail,
            epoch,
            origin: origin.clone(),
            title: title.to_string(),
            content_ref: ContentRef {
                uri: format!("civic://{}/{}", realm_id.0, thread_id),
                content_hash,
            },
            participants: vec![ThreadParticipant {
                role: "author".into(),
                actor_id: origin.actor_id.clone(),
                actor_type: origin.actor_type,
            }],
            causal_refs: Vec::new(),
            proposal_ref,
            stage: ThreadStage::Open,
            proof: ThreadProof {
                thread_root,
                signatures: Vec::new(),
            },
            metadata: HashMap::new(),
        };

        let idx = self.threads.len();
        self.thread_index.insert(thread_id.clone(), idx);
        self.realm_index
            .entry(realm_id)
            .or_default()
            .push(thread_id.clone());
        self.epoch_index
            .entry(epoch)
            .or_default()
            .push(thread_id);
        self.threads.push(thread.clone());

        thread
    }

    /// Add a message to a thread
    pub fn add_message(
        &mut self,
        thread_id: &str,
        author: ThreadOrigin,
        epoch: Epoch,
        content_summary: &str,
        position: MessagePosition,
    ) -> Option<ThreadMessage> {
        let _idx = self.thread_index.get(thread_id)?;

        let message_id = {
            let mut h = Sha256::new();
            h.update(thread_id.as_bytes());
            h.update(author.actor_id.as_bytes());
            h.update(epoch.to_le_bytes());
            h.update(content_summary.as_bytes());
            hex::encode(&h.finalize()[..12])
        };

        let content_hash = {
            let mut h = Sha256::new();
            h.update(content_summary.as_bytes());
            hex::encode(h.finalize())
        };

        let msg = ThreadMessage {
            message_id,
            thread_id: thread_id.to_string(),
            author,
            epoch,
            content_hash,
            content_summary: content_summary.to_string(),
            position,
            references: Vec::new(),
        };

        self.messages.push(msg.clone());
        Some(msg)
    }

    /// Advance thread to a new stage
    pub fn advance_stage(&mut self, thread_id: &str, new_stage: ThreadStage) -> bool {
        if let Some(&idx) = self.thread_index.get(thread_id) {
            self.threads[idx].stage = new_stage;
            true
        } else {
            false
        }
    }

    /// Get thread by ID
    pub fn get_thread(&self, thread_id: &str) -> Option<&CivicThread> {
        self.thread_index.get(thread_id).map(|&i| &self.threads[i])
    }

    /// Get all threads for an epoch
    pub fn threads_for_epoch(&self, epoch: Epoch) -> Vec<&CivicThread> {
        self.epoch_index
            .get(&epoch)
            .map(|ids| {
                ids.iter()
                    .filter_map(|id| self.get_thread(id))
                    .collect()
            })
            .unwrap_or_default()
    }

    /// Get all threads for a realm
    pub fn threads_for_realm(&self, realm_id: &RealmId) -> Vec<&CivicThread> {
        self.realm_index
            .get(realm_id)
            .map(|ids| {
                ids.iter()
                    .filter_map(|id| self.get_thread(id))
                    .collect()
            })
            .unwrap_or_default()
    }

    /// Get messages for a thread
    pub fn messages_for_thread(&self, thread_id: &str) -> Vec<&ThreadMessage> {
        self.messages
            .iter()
            .filter(|m| m.thread_id == thread_id)
            .collect()
    }

    /// Total thread count
    pub fn total_threads(&self) -> usize {
        self.threads.len()
    }

    /// Total message count
    pub fn total_messages(&self) -> usize {
        self.messages.len()
    }

    /// Count threads by type
    pub fn count_by_type(&self, thread_type: ThreadType) -> usize {
        self.threads
            .iter()
            .filter(|t| t.thread_type == thread_type)
            .count()
    }
}
