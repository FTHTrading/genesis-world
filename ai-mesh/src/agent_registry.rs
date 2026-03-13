//! Agent Registry — Central identity ledger for all AI agents

use gsp_agents::identity::AgentIdentity;
use gsp_kernel::{AgentBirthCertificate, RealmId};
use std::collections::HashMap;

/// Central agent registry
pub struct AgentRegistry {
    agents: HashMap<String, AgentIdentity>,
    realm_index: HashMap<RealmId, Vec<String>>,
    lineage_index: HashMap<String, Vec<String>>,
}

impl AgentRegistry {
    pub fn new() -> Self {
        Self {
            agents: HashMap::new(),
            realm_index: HashMap::new(),
            lineage_index: HashMap::new(),
        }
    }

    /// Register an agent from birth certificate
    pub fn register(&mut self, cert: AgentBirthCertificate) {
        let id = cert.agent_id.clone();
        let realm = cert.realm_id.clone();
        let lineage = cert.rail_type.agent_lineage().to_string();

        let identity = AgentIdentity::from_birth(cert);
        self.agents.insert(id.clone(), identity);

        self.realm_index
            .entry(realm)
            .or_insert_with(Vec::new)
            .push(id.clone());

        self.lineage_index
            .entry(lineage)
            .or_insert_with(Vec::new)
            .push(id);
    }

    /// Get agent by ID
    pub fn get(&self, agent_id: &str) -> Option<&AgentIdentity> {
        self.agents.get(agent_id)
    }

    /// Get mutable agent by ID
    pub fn get_mut(&mut self, agent_id: &str) -> Option<&mut AgentIdentity> {
        self.agents.get_mut(agent_id)
    }

    /// Get all agents in a realm
    pub fn realm_agents(&self, realm_id: &RealmId) -> Vec<&AgentIdentity> {
        self.realm_index
            .get(realm_id)
            .map(|ids| {
                ids.iter()
                    .filter_map(|id| self.agents.get(id))
                    .collect()
            })
            .unwrap_or_default()
    }

    /// Get all agents of a lineage
    pub fn lineage_agents(&self, lineage: &str) -> Vec<&AgentIdentity> {
        self.lineage_index
            .get(lineage)
            .map(|ids| {
                ids.iter()
                    .filter_map(|id| self.agents.get(id))
                    .collect()
            })
            .unwrap_or_default()
    }

    /// Total registered agents
    pub fn total_agents(&self) -> usize {
        self.agents.len()
    }

    /// Get all agent IDs
    pub fn all_ids(&self) -> Vec<String> {
        self.agents.keys().cloned().collect()
    }

    /// Summary of all lineages
    pub fn lineage_summary(&self) -> HashMap<String, usize> {
        self.lineage_index
            .iter()
            .map(|(k, v)| (k.clone(), v.len()))
            .collect()
    }
}
