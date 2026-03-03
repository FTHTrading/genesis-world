//! Civilization Hierarchy — Tiers, roles, and permission gating
//!
//! GSP-CIVIC defines a four-tier hierarchy with five core roles.
//! Each role maps to specific tier-level permissions for thread operations.

use gsp_kernel::Epoch;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Four-tier civilization hierarchy
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash, Serialize, Deserialize)]
pub enum CivilizationTier {
    /// Fundamental rules (hard invariants) — humans only
    Constitutional = 4,
    /// High-level governance — hybrid (human + senior agents)
    Governance = 3,
    /// Day-to-day operations — AI agents + validators
    Operations = 2,
    /// General participation — all actors
    Citizens = 1,
}

impl CivilizationTier {
    pub fn label(&self) -> &'static str {
        match self {
            Self::Constitutional => "CONSTITUTIONAL",
            Self::Governance => "GOVERNANCE",
            Self::Operations => "OPERATIONS",
            Self::Citizens => "CITIZENS",
        }
    }

    /// Whether AI agents can participate at this tier
    pub fn allows_ai(&self) -> bool {
        match self {
            Self::Constitutional => false,
            Self::Governance => true,
            Self::Operations => true,
            Self::Citizens => true,
        }
    }

    /// Whether human validators are required at this tier
    pub fn requires_human(&self) -> bool {
        match self {
            Self::Constitutional => true,
            Self::Governance => true,
            Self::Operations => false,
            Self::Citizens => false,
        }
    }
}

/// Core civilization roles
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum CivicRole {
    /// System designers, constitutional authors — highest tier
    Architect,
    /// Security monitors, slashing enforcers — governance tier
    Sentinel,
    /// Knowledge curators, precedent managers — governance/operations
    Curator,
    /// Realm creators, original stakers — operations tier
    Founder,
    /// General participants — citizens tier
    Citizen,
}

impl CivicRole {
    pub fn label(&self) -> &'static str {
        match self {
            Self::Architect => "ARCHITECT",
            Self::Sentinel => "SENTINEL",
            Self::Curator => "CURATOR",
            Self::Founder => "FOUNDER",
            Self::Citizen => "CITIZEN",
        }
    }

    /// The minimum tier this role can operate at
    pub fn min_tier(&self) -> CivilizationTier {
        match self {
            Self::Architect => CivilizationTier::Constitutional,
            Self::Sentinel => CivilizationTier::Governance,
            Self::Curator => CivilizationTier::Governance,
            Self::Founder => CivilizationTier::Operations,
            Self::Citizen => CivilizationTier::Citizens,
        }
    }

    /// Can this role create threads at the given tier?
    pub fn can_create_at(&self, tier: CivilizationTier) -> bool {
        self.min_tier() <= tier
    }

    /// Can this role vote at the given tier?
    pub fn can_vote_at(&self, tier: CivilizationTier) -> bool {
        self.min_tier() <= tier
    }

    /// Can this role veto at the given tier?
    pub fn can_veto_at(&self, tier: CivilizationTier) -> bool {
        match self {
            Self::Architect => true,
            Self::Sentinel => tier != CivilizationTier::Constitutional,
            _ => false,
        }
    }
}

/// Actor type distinction for role assignment
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum HierarchyActorType {
    Human,
    Agent,
    Validator,
}

/// Assigned role for a specific actor
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RoleAssignment {
    pub actor_id: String,
    pub actor_type: HierarchyActorType,
    pub role: CivicRole,
    pub assigned_epoch: Epoch,
    pub reputation_score: f64,
    pub active: bool,
}

/// The role registry — manages all civilization role assignments
pub struct RoleRegistry {
    assignments: Vec<RoleAssignment>,
    actor_index: HashMap<String, usize>,
}

impl RoleRegistry {
    pub fn new() -> Self {
        Self {
            assignments: Vec::new(),
            actor_index: HashMap::new(),
        }
    }

    /// Assign a role to an actor
    pub fn assign_role(
        &mut self,
        actor_id: &str,
        actor_type: HierarchyActorType,
        role: CivicRole,
        epoch: Epoch,
    ) -> &RoleAssignment {
        // Enforce: humans-only for Constitutional tier
        if role.min_tier() == CivilizationTier::Constitutional
            && actor_type != HierarchyActorType::Human
        {
            // Downgrade to Sentinel if non-human tries Architect
            let adjusted_role = CivicRole::Sentinel;
            return self.assign_role_inner(actor_id, actor_type, adjusted_role, epoch);
        }
        self.assign_role_inner(actor_id, actor_type, role, epoch)
    }

    fn assign_role_inner(
        &mut self,
        actor_id: &str,
        actor_type: HierarchyActorType,
        role: CivicRole,
        epoch: Epoch,
    ) -> &RoleAssignment {
        let assignment = RoleAssignment {
            actor_id: actor_id.to_string(),
            actor_type,
            role,
            assigned_epoch: epoch,
            reputation_score: 50.0,
            active: true,
        };

        if let Some(&idx) = self.actor_index.get(actor_id) {
            self.assignments[idx] = assignment;
            &self.assignments[idx]
        } else {
            let idx = self.assignments.len();
            self.actor_index.insert(actor_id.to_string(), idx);
            self.assignments.push(assignment);
            &self.assignments[idx]
        }
    }

    /// Check if an actor can perform an action at a given tier
    pub fn can_act_at(&self, actor_id: &str, tier: CivilizationTier) -> bool {
        self.get_assignment(actor_id)
            .map(|a| a.active && a.role.can_create_at(tier))
            .unwrap_or(false)
    }

    /// Check if an actor can veto at a given tier
    pub fn can_veto_at(&self, actor_id: &str, tier: CivilizationTier) -> bool {
        self.get_assignment(actor_id)
            .map(|a| a.active && a.role.can_veto_at(tier))
            .unwrap_or(false)
    }

    /// Get a role assignment by actor ID
    pub fn get_assignment(&self, actor_id: &str) -> Option<&RoleAssignment> {
        self.actor_index
            .get(actor_id)
            .map(|&i| &self.assignments[i])
    }

    /// Get the role for an actor (defaults to Citizen)
    pub fn role_for(&self, actor_id: &str) -> CivicRole {
        self.get_assignment(actor_id)
            .map(|a| a.role)
            .unwrap_or(CivicRole::Citizen)
    }

    /// Update reputation score for an actor
    pub fn update_reputation(&mut self, actor_id: &str, delta: f64) {
        if let Some(&idx) = self.actor_index.get(actor_id) {
            let score = &mut self.assignments[idx].reputation_score;
            *score = (*score + delta).clamp(0.0, 100.0);
        }
    }

    /// Deactivate an actor (e.g. slashed)
    pub fn deactivate(&mut self, actor_id: &str) {
        if let Some(&idx) = self.actor_index.get(actor_id) {
            self.assignments[idx].active = false;
        }
    }

    /// List all actors with a given role
    pub fn actors_with_role(&self, role: CivicRole) -> Vec<&RoleAssignment> {
        self.assignments
            .iter()
            .filter(|a| a.role == role && a.active)
            .collect()
    }

    /// Total active assignments
    pub fn active_count(&self) -> usize {
        self.assignments.iter().filter(|a| a.active).count()
    }
}
