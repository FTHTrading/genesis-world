//! Token Definitions — The Capital Constellation
//!
//! $CORE — Civilization gravity token (staking, gas, governance)
//! $ORIGIN — Genesis funding token (limited supply, revenue participation)
//! $AURUM, $LEX, $NOVA, $MERC, $LUDO — Rail-specific infrastructure tokens

use gsp_kernel::RailType;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Token type in the GSP ecosystem
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum TokenType {
    Core,       // $CORE
    Origin,     // $ORIGIN
    Rail(RailType), // Rail-specific tokens
}

impl TokenType {
    pub fn symbol(&self) -> &str {
        match self {
            TokenType::Core => "CORE",
            TokenType::Origin => "ORIGIN",
            TokenType::Rail(r) => r.token_symbol(),
        }
    }

    pub fn name(&self) -> &str {
        match self {
            TokenType::Core => "Sentience Core",
            TokenType::Origin => "Genesis Origin",
            TokenType::Rail(RailType::Finance) => "Aurum",
            TokenType::Rail(RailType::Governance) => "Lex",
            TokenType::Rail(RailType::Research) => "Nova",
            TokenType::Rail(RailType::Trade) => "Mercator",
            TokenType::Rail(RailType::Chaos) => "Ludos",
        }
    }
}

/// Token supply configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TokenSupplyConfig {
    pub token_type: TokenType,
    pub initial_supply: u64,
    pub max_supply: Option<u64>,
    pub emission_type: EmissionType,
    pub decimals: u8,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub enum EmissionType {
    /// Deflationary bias with AI-adjusted staking rewards
    DeflatinaryAdjusted,
    /// Fixed supply, no emission
    FixedSupply,
    /// Dynamic inflation based on rail productivity
    DynamicInflation,
}

/// Complete token state
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TokenState {
    pub token_type: TokenType,
    pub circulating_supply: u64,
    pub staked_supply: u64,
    pub treasury_held: u64,
    pub burned: u64,
    pub total_minted: u64,
    pub current_price_usd: Option<f64>,
}

/// Genesis token allocation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GenesisTokenAllocation {
    pub core: CoreAllocation,
    pub origin: OriginAllocation,
    pub rail_allocations: HashMap<RailType, u64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CoreAllocation {
    pub total_supply: u64,
    pub validator_pool: u64,      // % allocated to validator staking
    pub ai_compute_pool: u64,     // % for AI agent compute credits
    pub treasury_reserve: u64,    // % held in treasury
    pub ecosystem_grants: u64,    // % for grants
    pub founding_team: u64,       // % for founding team (vested)
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OriginAllocation {
    pub total_supply: u64,
    pub genesis_backers: u64,     // % for genesis round investors
    pub founding_houses: u64,     // % for founding house NFT holders
    pub realm_seed_pool: u64,     // % for realm spawning
    pub strategic_reserve: u64,   // % strategic reserve
}

impl GenesisTokenAllocation {
    /// Create default allocation
    pub fn default_allocation() -> Self {
        Self {
            core: CoreAllocation {
                total_supply: 1_000_000_000, // 1B $CORE
                validator_pool: 400_000_000,  // 40%
                ai_compute_pool: 150_000_000, // 15%
                treasury_reserve: 200_000_000, // 20%
                ecosystem_grants: 150_000_000, // 15%
                founding_team: 100_000_000,    // 10%
            },
            origin: OriginAllocation {
                total_supply: 100_000_000,    // 100M $ORIGIN (1/10 of CORE)
                genesis_backers: 30_000_000,   // 30%
                founding_houses: 20_000_000,   // 20%
                realm_seed_pool: 30_000_000,   // 30%
                strategic_reserve: 20_000_000, // 20%
            },
            rail_allocations: HashMap::from([
                (RailType::Finance, 50_000_000),
                (RailType::Governance, 30_000_000),
                (RailType::Research, 40_000_000),
                (RailType::Trade, 50_000_000),
                (RailType::Chaos, 30_000_000),
            ]),
        }
    }

    /// Validate allocations sum correctly
    pub fn validate(&self) -> Result<(), String> {
        let core_sum = self.core.validator_pool
            + self.core.ai_compute_pool
            + self.core.treasury_reserve
            + self.core.ecosystem_grants
            + self.core.founding_team;

        if core_sum != self.core.total_supply {
            return Err(format!(
                "$CORE allocation mismatch: {} != {}",
                core_sum, self.core.total_supply
            ));
        }

        let origin_sum = self.origin.genesis_backers
            + self.origin.founding_houses
            + self.origin.realm_seed_pool
            + self.origin.strategic_reserve;

        if origin_sum != self.origin.total_supply {
            return Err(format!(
                "$ORIGIN allocation mismatch: {} != {}",
                origin_sum, self.origin.total_supply
            ));
        }

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_default_allocation_valid() {
        let alloc = GenesisTokenAllocation::default_allocation();
        assert!(alloc.validate().is_ok());
    }
}
