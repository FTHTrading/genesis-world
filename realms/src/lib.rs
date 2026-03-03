//! Sovereign Realms — Each realm is a mini digital country
//!
//! Realms can choose:
//! - EVM, WASM, ZK-native, or AI-assisted runtimes
//! - Custom tokenomics
//! - Custom slashing logic
//! - Custom governance DNA
//!
//! Realms are spawned at genesis or later via the Realm Foundry.

use gsp_kernel::{RailType, RealmId, RuntimeType, ValidatorId, Epoch};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// A sovereign realm
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SovereignRealm {
    pub id: RealmId,
    pub name: String,
    pub rail_type: RailType,
    pub runtime: RuntimeType,
    pub validators: Vec<ValidatorId>,
    pub agents: Vec<String>,
    pub treasury_balance: u64,
    pub custom_tokenomics: RealmTokenomics,
    pub governance: RealmGovernance,
    pub status: RealmStatus,
    pub birth_epoch: Epoch,
    pub block_height: u64,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum RealmStatus {
    Active,
    Bootstrapping,
    Suspended,
    Archived,
}

/// Custom tokenomics for a realm
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RealmTokenomics {
    pub token_symbol: String,
    pub initial_supply: u64,
    pub inflation_rate: f64,
    pub fee_model: FeeModel,
    pub burn_rate: f64,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub enum FeeModel {
    Fixed(u64),
    Dynamic,
    Auction,
    Free,
}

/// Governance configuration for a realm
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RealmGovernance {
    pub quorum_threshold: f64,
    pub proposal_bond: u64,
    pub voting_period_epochs: u64,
    pub veto_enabled: bool,
    pub ai_governance_weight: f64,
    pub human_governance_weight: f64,
}

/// Realm Foundry — spawns new realms
pub struct RealmFoundry {
    realms: HashMap<RealmId, SovereignRealm>,
}

impl RealmFoundry {
    pub fn new() -> Self {
        Self {
            realms: HashMap::new(),
        }
    }

    /// Spawn a new realm
    pub fn spawn_realm(
        &mut self,
        name: &str,
        rail_type: RailType,
        runtime: RuntimeType,
        validators: Vec<ValidatorId>,
        agents: Vec<String>,
        treasury: u64,
        epoch: Epoch,
    ) -> RealmId {
        let id = RealmId::new(name);

        let realm = SovereignRealm {
            id: id.clone(),
            name: name.to_string(),
            rail_type,
            runtime,
            validators,
            agents,
            treasury_balance: treasury,
            custom_tokenomics: RealmTokenomics {
                token_symbol: rail_type.token_symbol().to_string(),
                initial_supply: treasury * 10,
                inflation_rate: 0.05,
                fee_model: FeeModel::Dynamic,
                burn_rate: 0.3,
            },
            governance: RealmGovernance {
                quorum_threshold: 0.5,
                proposal_bond: 1000,
                voting_period_epochs: 10,
                veto_enabled: true,
                ai_governance_weight: 0.4,
                human_governance_weight: 0.6,
            },
            status: RealmStatus::Bootstrapping,
            birth_epoch: epoch,
            block_height: 0,
        };

        self.realms.insert(id.clone(), realm);
        id
    }

    /// Activate a bootstrapping realm
    pub fn activate_realm(&mut self, realm_id: &RealmId) -> bool {
        if let Some(realm) = self.realms.get_mut(realm_id) {
            if realm.status == RealmStatus::Bootstrapping {
                realm.status = RealmStatus::Active;
                return true;
            }
        }
        false
    }

    pub fn get_realm(&self, id: &RealmId) -> Option<&SovereignRealm> {
        self.realms.get(id)
    }

    pub fn active_realms(&self) -> Vec<&SovereignRealm> {
        self.realms
            .values()
            .filter(|r| r.status == RealmStatus::Active)
            .collect()
    }

    pub fn total_realms(&self) -> usize {
        self.realms.len()
    }
}
