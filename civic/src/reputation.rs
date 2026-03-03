//! Civic Reputation Engine — Merit-based scoring and permission gating
//!
//! Reputation in CIVIC is multi-dimensional and non-transferable.
//! It gates tier-level permissions and modulates agent autonomy.

use gsp_kernel::Epoch;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Multi-dimensional civic reputation profile
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CivicReputation {
    pub actor_id: String,
    /// Proposal acceptance rate (0.0 - 1.0)
    pub proposal_acceptance: f64,
    /// Predictive accuracy of agent forecasts (0.0 - 1.0)
    pub predictive_accuracy: f64,
    /// Quality of debate contributions (0.0 - 1.0)
    pub debate_quality: f64,
    /// Compliance with constitutional invariants (0.0 - 1.0)
    pub compliance_history: f64,
    /// Responsiveness during incidents (0.0 - 1.0)
    pub incident_response: f64,
    /// Number of proposals submitted
    pub proposals_submitted: u64,
    /// Number of proposals accepted
    pub proposals_accepted: u64,
    /// Number of debates participated in
    pub debates_participated: u64,
    /// Number of precedents co-authored
    pub precedents_authored: u64,
    /// Epoch of last update
    pub last_updated: Epoch,
}

impl CivicReputation {
    pub fn new(actor_id: &str, epoch: Epoch) -> Self {
        Self {
            actor_id: actor_id.to_string(),
            proposal_acceptance: 0.5,
            predictive_accuracy: 0.5,
            debate_quality: 0.5,
            compliance_history: 1.0,
            incident_response: 0.5,
            proposals_submitted: 0,
            proposals_accepted: 0,
            debates_participated: 0,
            precedents_authored: 0,
            last_updated: epoch,
        }
    }

    /// Composite merit score (weighted average of all dimensions)
    pub fn merit_score(&self) -> f64 {
        const W_PROPOSAL: f64 = 0.20;
        const W_PREDICT: f64 = 0.20;
        const W_DEBATE: f64 = 0.15;
        const W_COMPLIANCE: f64 = 0.30;
        const W_INCIDENT: f64 = 0.15;

        (self.proposal_acceptance * W_PROPOSAL
            + self.predictive_accuracy * W_PREDICT
            + self.debate_quality * W_DEBATE
            + self.compliance_history * W_COMPLIANCE
            + self.incident_response * W_INCIDENT)
            .clamp(0.0, 1.0)
    }

    /// Seniority bonus based on participation volume
    pub fn seniority_bonus(&self) -> f64 {
        let total_activity = self.proposals_submitted
            + self.debates_participated
            + self.precedents_authored;
        // Logarithmic scaling — diminishing returns
        (total_activity as f64).ln_1p() / 10.0
    }

    /// Effective score including seniority
    pub fn effective_score(&self) -> f64 {
        (self.merit_score() + self.seniority_bonus()).clamp(0.0, 1.0)
    }
}

/// Reputation threshold for tier access
#[derive(Debug, Clone, Copy)]
pub struct TierThreshold {
    pub min_merit: f64,
    pub min_compliance: f64,
    pub min_proposals: u64,
}

/// The civic reputation engine
pub struct CivicReputationEngine {
    profiles: HashMap<String, CivicReputation>,
    /// Thresholds for tier access (tier label → threshold)
    thresholds: HashMap<String, TierThreshold>,
    /// History of reputation events
    events: Vec<ReputationEvent>,
}

/// A recorded reputation change
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReputationEvent {
    pub actor_id: String,
    pub epoch: Epoch,
    pub dimension: String,
    pub old_value: f64,
    pub new_value: f64,
    pub reason: String,
}

impl CivicReputationEngine {
    pub fn new() -> Self {
        let mut thresholds = HashMap::new();

        thresholds.insert(
            "CONSTITUTIONAL".into(),
            TierThreshold {
                min_merit: 0.85,
                min_compliance: 0.95,
                min_proposals: 10,
            },
        );
        thresholds.insert(
            "GOVERNANCE".into(),
            TierThreshold {
                min_merit: 0.65,
                min_compliance: 0.80,
                min_proposals: 5,
            },
        );
        thresholds.insert(
            "OPERATIONS".into(),
            TierThreshold {
                min_merit: 0.40,
                min_compliance: 0.60,
                min_proposals: 1,
            },
        );
        thresholds.insert(
            "CITIZENS".into(),
            TierThreshold {
                min_merit: 0.0,
                min_compliance: 0.0,
                min_proposals: 0,
            },
        );

        Self {
            profiles: HashMap::new(),
            thresholds,
            events: Vec::new(),
        }
    }

    /// Get or create a reputation profile
    pub fn get_or_create(&mut self, actor_id: &str, epoch: Epoch) -> &CivicReputation {
        if !self.profiles.contains_key(actor_id) {
            self.profiles
                .insert(actor_id.to_string(), CivicReputation::new(actor_id, epoch));
        }
        self.profiles.get(actor_id).unwrap()
    }

    /// Get a profile (read-only)
    pub fn get_profile(&self, actor_id: &str) -> Option<&CivicReputation> {
        self.profiles.get(actor_id)
    }

    /// Record a successful proposal
    pub fn record_proposal_accepted(&mut self, actor_id: &str, epoch: Epoch) {
        let profile = self
            .profiles
            .entry(actor_id.to_string())
            .or_insert_with(|| CivicReputation::new(actor_id, epoch));

        profile.proposals_submitted += 1;
        profile.proposals_accepted += 1;

        let old = profile.proposal_acceptance;
        profile.proposal_acceptance = profile.proposals_accepted as f64
            / profile.proposals_submitted.max(1) as f64;
        profile.last_updated = epoch;

        self.events.push(ReputationEvent {
            actor_id: actor_id.to_string(),
            epoch,
            dimension: "proposal_acceptance".into(),
            old_value: old,
            new_value: profile.proposal_acceptance,
            reason: "proposal_accepted".into(),
        });
    }

    /// Record a rejected proposal
    pub fn record_proposal_rejected(&mut self, actor_id: &str, epoch: Epoch) {
        let profile = self
            .profiles
            .entry(actor_id.to_string())
            .or_insert_with(|| CivicReputation::new(actor_id, epoch));

        profile.proposals_submitted += 1;

        let old = profile.proposal_acceptance;
        profile.proposal_acceptance = profile.proposals_accepted as f64
            / profile.proposals_submitted.max(1) as f64;
        profile.last_updated = epoch;

        self.events.push(ReputationEvent {
            actor_id: actor_id.to_string(),
            epoch,
            dimension: "proposal_acceptance".into(),
            old_value: old,
            new_value: profile.proposal_acceptance,
            reason: "proposal_rejected".into(),
        });
    }

    /// Record debate participation
    pub fn record_debate_participation(
        &mut self,
        actor_id: &str,
        epoch: Epoch,
        quality_score: f64,
    ) {
        let profile = self
            .profiles
            .entry(actor_id.to_string())
            .or_insert_with(|| CivicReputation::new(actor_id, epoch));

        profile.debates_participated += 1;

        let old = profile.debate_quality;
        // Exponential moving average
        profile.debate_quality =
            profile.debate_quality * 0.8 + quality_score.clamp(0.0, 1.0) * 0.2;
        profile.last_updated = epoch;

        self.events.push(ReputationEvent {
            actor_id: actor_id.to_string(),
            epoch,
            dimension: "debate_quality".into(),
            old_value: old,
            new_value: profile.debate_quality,
            reason: "debate_participation".into(),
        });
    }

    /// Record a compliance violation
    pub fn record_violation(&mut self, actor_id: &str, epoch: Epoch, severity: f64) {
        let profile = self
            .profiles
            .entry(actor_id.to_string())
            .or_insert_with(|| CivicReputation::new(actor_id, epoch));

        let old = profile.compliance_history;
        profile.compliance_history =
            (profile.compliance_history - severity.clamp(0.0, 0.5)).clamp(0.0, 1.0);
        profile.last_updated = epoch;

        self.events.push(ReputationEvent {
            actor_id: actor_id.to_string(),
            epoch,
            dimension: "compliance_history".into(),
            old_value: old,
            new_value: profile.compliance_history,
            reason: format!("violation_severity_{:.2}", severity),
        });
    }

    /// Record incident response
    pub fn record_incident_response(
        &mut self,
        actor_id: &str,
        epoch: Epoch,
        response_quality: f64,
    ) {
        let profile = self
            .profiles
            .entry(actor_id.to_string())
            .or_insert_with(|| CivicReputation::new(actor_id, epoch));

        let old = profile.incident_response;
        profile.incident_response =
            profile.incident_response * 0.7 + response_quality.clamp(0.0, 1.0) * 0.3;
        profile.last_updated = epoch;

        self.events.push(ReputationEvent {
            actor_id: actor_id.to_string(),
            epoch,
            dimension: "incident_response".into(),
            old_value: old,
            new_value: profile.incident_response,
            reason: "incident_response".into(),
        });
    }

    /// Record precedent authorship
    pub fn record_precedent_authored(&mut self, actor_id: &str, epoch: Epoch) {
        let profile = self
            .profiles
            .entry(actor_id.to_string())
            .or_insert_with(|| CivicReputation::new(actor_id, epoch));
        profile.precedents_authored += 1;
        profile.last_updated = epoch;
    }

    /// Check if an actor meets the threshold for a given tier
    pub fn meets_threshold(&self, actor_id: &str, tier_label: &str) -> bool {
        let threshold = match self.thresholds.get(tier_label) {
            Some(t) => t,
            None => return false,
        };

        match self.profiles.get(actor_id) {
            Some(profile) => {
                profile.merit_score() >= threshold.min_merit
                    && profile.compliance_history >= threshold.min_compliance
                    && profile.proposals_submitted >= threshold.min_proposals
            }
            None => tier_label == "CITIZENS",
        }
    }

    /// Get the highest tier an actor qualifies for
    pub fn highest_tier(&self, actor_id: &str) -> &'static str {
        let tiers = [
            ("CONSTITUTIONAL", 4),
            ("GOVERNANCE", 3),
            ("OPERATIONS", 2),
            ("CITIZENS", 1),
        ];

        for (tier, _) in tiers {
            if self.meets_threshold(actor_id, tier) {
                return tier;
            }
        }
        "CITIZENS"
    }

    /// Get merit score for an actor
    pub fn merit_score(&self, actor_id: &str) -> f64 {
        self.profiles
            .get(actor_id)
            .map(|p| p.merit_score())
            .unwrap_or(0.0)
    }

    /// Get effective score for an actor
    pub fn effective_score(&self, actor_id: &str) -> f64 {
        self.profiles
            .get(actor_id)
            .map(|p| p.effective_score())
            .unwrap_or(0.0)
    }

    /// Total tracked actors
    pub fn total_actors(&self) -> usize {
        self.profiles.len()
    }

    /// Get reputation events for an actor
    pub fn events_for(&self, actor_id: &str) -> Vec<&ReputationEvent> {
        self.events
            .iter()
            .filter(|e| e.actor_id == actor_id)
            .collect()
    }

    /// Get all events for an epoch
    pub fn events_for_epoch(&self, epoch: Epoch) -> Vec<&ReputationEvent> {
        self.events.iter().filter(|e| e.epoch == epoch).collect()
    }
}
