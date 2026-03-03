//! Evolution Engine — Controlled agent mutation system
//!
//! Agents evolve only in permitted dimensions.
//! Evolution is epoch-based and recorded on-chain.
//!
//! Allowed: optimization_bias, risk_tolerance, autonomy scaling
//! Forbidden: rail migration, constitutional override, infinite expansion

use crate::dna::AgentDNA;
use crate::identity::AgentIdentity;
use gsp_kernel::Epoch;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};

/// Evolution proposal from an agent
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EvolutionProposal {
    pub agent_id: String,
    pub epoch: Epoch,
    pub parameter: String,
    pub delta: f64,
    pub rationale: String,
    pub intent_hash: String,
}

/// Evolution result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EvolutionResult {
    pub agent_id: String,
    pub epoch: Epoch,
    pub approved: bool,
    pub parameter: String,
    pub old_value: f64,
    pub new_value: f64,
    pub delta: f64,
    pub new_dna_hash: String,
    pub generation: u32,
    pub rejection_reason: Option<String>,
}

/// The Evolution Engine
pub struct EvolutionEngine {
    history: Vec<EvolutionResult>,
    max_mutations_per_epoch: u32,
}

impl EvolutionEngine {
    pub fn new(max_mutations_per_epoch: u32) -> Self {
        Self {
            history: Vec::new(),
            max_mutations_per_epoch,
        }
    }

    /// Process an evolution proposal
    pub fn process_proposal(
        &mut self,
        proposal: EvolutionProposal,
        dna: &mut AgentDNA,
        governance_approved: bool,
    ) -> EvolutionResult {
        // Check if governance approval is required and not given
        if dna.mutation_permissions.requires_approval && !governance_approved {
            let result = EvolutionResult {
                agent_id: proposal.agent_id,
                epoch: proposal.epoch,
                approved: false,
                parameter: proposal.parameter,
                old_value: 0.0,
                new_value: 0.0,
                delta: proposal.delta,
                new_dna_hash: dna.current_hash.clone(),
                generation: dna.generation,
                rejection_reason: Some("Governance approval required".into()),
            };
            self.history.push(result.clone());
            return result;
        }

        // Check epoch mutation limit
        let epoch_mutations = self
            .history
            .iter()
            .filter(|r| r.epoch == proposal.epoch && r.agent_id == proposal.agent_id && r.approved)
            .count() as u32;

        if epoch_mutations >= self.max_mutations_per_epoch {
            let result = EvolutionResult {
                agent_id: proposal.agent_id,
                epoch: proposal.epoch,
                approved: false,
                parameter: proposal.parameter,
                old_value: 0.0,
                new_value: 0.0,
                delta: proposal.delta,
                new_dna_hash: dna.current_hash.clone(),
                generation: dna.generation,
                rejection_reason: Some(format!(
                    "Max mutations per epoch ({}) exceeded",
                    self.max_mutations_per_epoch
                )),
            };
            self.history.push(result.clone());
            return result;
        }

        // Get old value
        let old_value = match proposal.parameter.as_str() {
            "optimization_bias" => dna.vector.optimization_bias,
            "risk_tolerance" => dna.vector.risk_tolerance,
            "entropy_sensitivity" => dna.vector.entropy_sensitivity,
            "autonomy_level" => dna.vector.autonomy_level,
            "governance_alignment" => dna.vector.governance_alignment,
            _ => {
                let result = EvolutionResult {
                    agent_id: proposal.agent_id,
                    epoch: proposal.epoch,
                    approved: false,
                    parameter: proposal.parameter,
                    old_value: 0.0,
                    new_value: 0.0,
                    delta: proposal.delta,
                    new_dna_hash: dna.current_hash.clone(),
                    generation: dna.generation,
                    rejection_reason: Some("Unknown parameter".into()),
                };
                self.history.push(result.clone());
                return result;
            }
        };

        // Attempt mutation
        match dna.mutate(&proposal.parameter, proposal.delta) {
            Ok(()) => {
                let new_value = match proposal.parameter.as_str() {
                    "optimization_bias" => dna.vector.optimization_bias,
                    "risk_tolerance" => dna.vector.risk_tolerance,
                    "entropy_sensitivity" => dna.vector.entropy_sensitivity,
                    "autonomy_level" => dna.vector.autonomy_level,
                    "governance_alignment" => dna.vector.governance_alignment,
                    _ => 0.0,
                };

                let result = EvolutionResult {
                    agent_id: proposal.agent_id,
                    epoch: proposal.epoch,
                    approved: true,
                    parameter: proposal.parameter,
                    old_value,
                    new_value,
                    delta: proposal.delta,
                    new_dna_hash: dna.current_hash.clone(),
                    generation: dna.generation,
                    rejection_reason: None,
                };
                self.history.push(result.clone());
                result
            }
            Err(e) => {
                let result = EvolutionResult {
                    agent_id: proposal.agent_id,
                    epoch: proposal.epoch,
                    approved: false,
                    parameter: proposal.parameter,
                    old_value,
                    new_value: old_value,
                    delta: proposal.delta,
                    new_dna_hash: dna.current_hash.clone(),
                    generation: dna.generation,
                    rejection_reason: Some(e),
                };
                self.history.push(result.clone());
                result
            }
        }
    }

    pub fn history(&self) -> &[EvolutionResult] {
        &self.history
    }

    pub fn approved_mutations(&self) -> usize {
        self.history.iter().filter(|r| r.approved).count()
    }

    pub fn rejected_mutations(&self) -> usize {
        self.history.iter().filter(|r| !r.approved).count()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use gsp_kernel::{GeneticVector, RailType};

    #[test]
    fn test_evolution_cycle() {
        let vector = GeneticVector {
            optimization_bias: 0.5,
            risk_tolerance: 0.5,
            entropy_sensitivity: 0.5,
            autonomy_level: 0.5,
            governance_alignment: 0.5,
        };

        let mut dna = AgentDNA::from_vector(vector, RailType::Finance);
        let mut engine = EvolutionEngine::new(3);

        let proposal = EvolutionProposal {
            agent_id: "agent-001".into(),
            epoch: 1,
            parameter: "optimization_bias".into(),
            delta: 0.02,
            rationale: "Market conditions favor aggressive optimization".into(),
            intent_hash: "0xabc".into(),
        };

        let result = engine.process_proposal(proposal, &mut dna, false);
        assert!(result.approved);
        assert_eq!(result.generation, 1);
        println!(
            "Evolved: {} {:.4} -> {:.4}",
            result.parameter, result.old_value, result.new_value
        );
    }
}
