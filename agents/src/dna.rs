//! Agent DNA — Deterministic parameter vector system
//!
//! DNA is not metaphorical. It is a structured, immutable-at-core parameter
//! vector that defines an agent's behavioral tendencies and constitutional limits.
//!
//! Each agent lineage (AURUM, LEXICON, NOVA, MERCATOR, LUDOS) has a base
//! genetic template. Agents are born with bounded random variance applied
//! to the template.

use gsp_kernel::{GeneticVector, RailType};
use rand::Rng;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};

/// Complete DNA profile for an agent
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentDNA {
    /// Core genetic vector
    pub vector: GeneticVector,
    /// Rail-specific trait modifiers
    pub traits: Vec<AgentTrait>,
    /// Mutation permissions
    pub mutation_permissions: MutationPermissions,
    /// Immutable DNA hash
    pub genesis_hash: String,
    /// Current DNA hash (may differ after evolution)
    pub current_hash: String,
    /// Generation number (0 = genesis)
    pub generation: u32,
}

/// Named traits that emerge from the genetic vector
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentTrait {
    pub name: String,
    pub category: TraitCategory,
    pub strength: f64, // 0.0 to 1.0
    pub description: String,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum TraitCategory {
    Economic,
    Governance,
    Security,
    Exploration,
    Social,
}

/// What an agent is allowed to mutate about itself
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MutationPermissions {
    /// Allowed parameters to mutate
    pub allowed_params: Vec<String>,
    /// Maximum delta per mutation
    pub max_delta: f64,
    /// Requires governance approval
    pub requires_approval: bool,
    /// Forbidden mutations
    pub forbidden: Vec<String>,
}

impl AgentDNA {
    /// Create DNA from a genetic vector
    pub fn from_vector(vector: GeneticVector, rail_type: RailType) -> Self {
        let traits = Self::derive_traits(&vector, rail_type);
        let permissions = Self::default_permissions(rail_type);

        let hash = Self::compute_hash(&vector);

        Self {
            vector,
            traits,
            mutation_permissions: permissions,
            genesis_hash: hash.clone(),
            current_hash: hash,
            generation: 0,
        }
    }

    /// Derive named traits from the genetic vector
    fn derive_traits(vector: &GeneticVector, rail_type: RailType) -> Vec<AgentTrait> {
        let mut traits = Vec::new();

        // Universal traits derived from vector
        if vector.optimization_bias > 0.7 {
            traits.push(AgentTrait {
                name: "Optimizer".into(),
                category: TraitCategory::Economic,
                strength: vector.optimization_bias,
                description: "Aggressively seeks optimal outcomes".into(),
            });
        }

        if vector.risk_tolerance > 0.6 {
            traits.push(AgentTrait {
                name: "Risk Taker".into(),
                category: TraitCategory::Economic,
                strength: vector.risk_tolerance,
                description: "Willing to accept higher variance for higher returns".into(),
            });
        } else if vector.risk_tolerance < 0.3 {
            traits.push(AgentTrait {
                name: "Conservative".into(),
                category: TraitCategory::Security,
                strength: 1.0 - vector.risk_tolerance,
                description: "Prefers stability over high returns".into(),
            });
        }

        if vector.entropy_sensitivity > 0.7 {
            traits.push(AgentTrait {
                name: "Chaos Navigator".into(),
                category: TraitCategory::Exploration,
                strength: vector.entropy_sensitivity,
                description: "Thrives in high-entropy environments".into(),
            });
        }

        if vector.governance_alignment > 0.8 {
            traits.push(AgentTrait {
                name: "Lawkeeper".into(),
                category: TraitCategory::Governance,
                strength: vector.governance_alignment,
                description: "Strongly enforces constitutional rules".into(),
            });
        }

        if vector.autonomy_level > 0.7 {
            traits.push(AgentTrait {
                name: "Independent".into(),
                category: TraitCategory::Social,
                strength: vector.autonomy_level,
                description: "Operates with minimal human guidance".into(),
            });
        }

        // Rail-specific traits
        match rail_type {
            RailType::Finance => {
                traits.push(AgentTrait {
                    name: "Yield Seeker".into(),
                    category: TraitCategory::Economic,
                    strength: vector.optimization_bias * 0.9 + 0.1,
                    description: "Naturally gravitates toward yield opportunities".into(),
                });
            }
            RailType::Governance => {
                traits.push(AgentTrait {
                    name: "Arbiter".into(),
                    category: TraitCategory::Governance,
                    strength: vector.governance_alignment,
                    description: "Evaluates proposals against constitutional law".into(),
                });
            }
            RailType::Research => {
                traits.push(AgentTrait {
                    name: "Explorer".into(),
                    category: TraitCategory::Exploration,
                    strength: vector.entropy_sensitivity * 0.8 + 0.2,
                    description: "Seeks novel patterns and undiscovered knowledge".into(),
                });
            }
            RailType::Trade => {
                traits.push(AgentTrait {
                    name: "Arbitrageur".into(),
                    category: TraitCategory::Economic,
                    strength: vector.optimization_bias * vector.risk_tolerance,
                    description: "Identifies cross-realm price inefficiencies".into(),
                });
            }
            RailType::Chaos => {
                traits.push(AgentTrait {
                    name: "Stress Tester".into(),
                    category: TraitCategory::Security,
                    strength: vector.entropy_sensitivity,
                    description: "Probes the system for weaknesses".into(),
                });
            }
        }

        traits
    }

    /// Default mutation permissions per rail type
    fn default_permissions(rail_type: RailType) -> MutationPermissions {
        match rail_type {
            RailType::Finance => MutationPermissions {
                allowed_params: vec![
                    "optimization_bias".into(),
                    "risk_tolerance".into(),
                ],
                max_delta: 0.03,
                requires_approval: false,
                forbidden: vec![
                    "rail_migration".into(),
                    "constitutional_override".into(),
                ],
            },
            RailType::Governance => MutationPermissions {
                allowed_params: vec!["governance_alignment".into()],
                max_delta: 0.02,
                requires_approval: true,
                forbidden: vec![
                    "rail_migration".into(),
                    "constitutional_override".into(),
                    "autonomy_level".into(),
                ],
            },
            RailType::Research => MutationPermissions {
                allowed_params: vec![
                    "optimization_bias".into(),
                    "entropy_sensitivity".into(),
                    "autonomy_level".into(),
                ],
                max_delta: 0.05,
                requires_approval: false,
                forbidden: vec![
                    "rail_migration".into(),
                    "constitutional_override".into(),
                ],
            },
            RailType::Trade => MutationPermissions {
                allowed_params: vec![
                    "optimization_bias".into(),
                    "risk_tolerance".into(),
                ],
                max_delta: 0.04,
                requires_approval: false,
                forbidden: vec![
                    "rail_migration".into(),
                    "constitutional_override".into(),
                ],
            },
            RailType::Chaos => MutationPermissions {
                allowed_params: vec![
                    "entropy_sensitivity".into(),
                    "risk_tolerance".into(),
                    "autonomy_level".into(),
                ],
                max_delta: 0.06,
                requires_approval: false,
                forbidden: vec![
                    "rail_migration".into(),
                    "constitutional_override".into(),
                ],
            },
        }
    }

    /// Compute hash of genetic vector
    fn compute_hash(vector: &GeneticVector) -> String {
        let bytes = serde_json::to_vec(vector).unwrap_or_default();
        let mut hasher = Sha256::new();
        hasher.update(&bytes);
        hex::encode(hasher.finalize())
    }

    /// Apply a mutation to a specific parameter
    pub fn mutate(&mut self, param: &str, delta: f64) -> Result<(), String> {
        if self.mutation_permissions.forbidden.contains(&param.to_string()) {
            return Err(format!("Mutation of '{}' is forbidden", param));
        }
        if !self.mutation_permissions.allowed_params.contains(&param.to_string()) {
            return Err(format!("Mutation of '{}' is not permitted", param));
        }
        if delta.abs() > self.mutation_permissions.max_delta {
            return Err(format!(
                "Delta {:.4} exceeds max allowed {:.4}",
                delta.abs(),
                self.mutation_permissions.max_delta
            ));
        }

        match param {
            "optimization_bias" => {
                self.vector.optimization_bias = (self.vector.optimization_bias + delta).clamp(0.0, 1.0);
            }
            "risk_tolerance" => {
                self.vector.risk_tolerance = (self.vector.risk_tolerance + delta).clamp(0.0, 1.0);
            }
            "entropy_sensitivity" => {
                self.vector.entropy_sensitivity = (self.vector.entropy_sensitivity + delta).clamp(0.0, 1.0);
            }
            "autonomy_level" => {
                self.vector.autonomy_level = (self.vector.autonomy_level + delta).clamp(0.0, 1.0);
            }
            "governance_alignment" => {
                self.vector.governance_alignment = (self.vector.governance_alignment + delta).clamp(0.0, 1.0);
            }
            _ => return Err(format!("Unknown parameter: {}", param)),
        }

        self.generation += 1;
        self.current_hash = Self::compute_hash(&self.vector);
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_dna_creation_and_traits() {
        let vector = GeneticVector {
            optimization_bias: 0.87,
            risk_tolerance: 0.32,
            entropy_sensitivity: 0.21,
            autonomy_level: 0.54,
            governance_alignment: 0.60,
        };

        let dna = AgentDNA::from_vector(vector, RailType::Finance);
        assert!(!dna.traits.is_empty());
        assert_eq!(dna.generation, 0);
        assert_eq!(dna.genesis_hash, dna.current_hash);

        for t in &dna.traits {
            println!("{}: {:.2} — {}", t.name, t.strength, t.description);
        }
    }

    #[test]
    fn test_mutation_within_bounds() {
        let vector = GeneticVector {
            optimization_bias: 0.50,
            risk_tolerance: 0.50,
            entropy_sensitivity: 0.50,
            autonomy_level: 0.50,
            governance_alignment: 0.50,
        };

        let mut dna = AgentDNA::from_vector(vector, RailType::Finance);
        let original_hash = dna.current_hash.clone();

        assert!(dna.mutate("optimization_bias", 0.02).is_ok());
        assert_ne!(dna.current_hash, original_hash);
        assert_eq!(dna.generation, 1);
    }

    #[test]
    fn test_forbidden_mutation() {
        let vector = GeneticVector {
            optimization_bias: 0.50,
            risk_tolerance: 0.50,
            entropy_sensitivity: 0.50,
            autonomy_level: 0.50,
            governance_alignment: 0.50,
        };

        let mut dna = AgentDNA::from_vector(vector, RailType::Finance);
        assert!(dna.mutate("constitutional_override", 0.01).is_err());
        assert!(dna.mutate("rail_migration", 0.01).is_err());
    }
}
