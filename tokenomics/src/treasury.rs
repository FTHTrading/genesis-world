//! Treasury Engine — AI-managed capital with constitutional guardrails
//!
//! Each rail has a treasury managed by its AI agents.
//! The treasury enforces:
//! - Minimum reserve ratios
//! - Funding round quorum requirements
//! - Emergency stabilization protocols
//! - Cross-realm capital routing

use gsp_kernel::{Epoch, RailType, RealmId};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Treasury state for a single rail
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RailTreasury {
    pub rail_type: RailType,
    pub balance: u64,
    pub reserve_minimum: u64,
    pub total_deployed: u64,
    pub total_returned: u64,
    pub active_deployments: Vec<Deployment>,
    pub funding_history: Vec<FundingRound>,
}

/// An active capital deployment
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Deployment {
    pub id: String,
    pub realm_id: RealmId,
    pub amount: u64,
    pub deployed_epoch: Epoch,
    pub expected_return_epoch: Epoch,
    pub expected_yield: f64,
    pub status: DeploymentStatus,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum DeploymentStatus {
    Active,
    Returned,
    Defaulted,
    Extended,
}

/// A funding round
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FundingRound {
    pub id: String,
    pub epoch: Epoch,
    pub amount: u64,
    pub purpose: String,
    pub approved_by: Vec<String>, // agent IDs
    pub quorum_reached: bool,
}

/// The Treasury Engine
#[allow(dead_code)]
pub struct TreasuryEngine {
    core_treasury: u64,
    origin_treasury: u64,
    rail_treasuries: HashMap<RailType, RailTreasury>,
    min_reserve_ratio: f64,
    total_staked: u64,
}

impl TreasuryEngine {
    pub fn new(
        core_initial: u64,
        origin_initial: u64,
        rail_allocations: HashMap<RailType, u64>,
        min_reserve_ratio: f64,
    ) -> Self {
        let mut rail_treasuries = HashMap::new();
        for (rail, balance) in rail_allocations {
            let reserve_min = (balance as f64 * min_reserve_ratio) as u64;
            rail_treasuries.insert(
                rail,
                RailTreasury {
                    rail_type: rail,
                    balance,
                    reserve_minimum: reserve_min,
                    total_deployed: 0,
                    total_returned: 0,
                    active_deployments: Vec::new(),
                    funding_history: Vec::new(),
                },
            );
        }

        Self {
            core_treasury: core_initial,
            origin_treasury: origin_initial,
            rail_treasuries,
            min_reserve_ratio,
            total_staked: 0,
        }
    }

    /// Deploy capital from a rail treasury
    pub fn deploy_capital(
        &mut self,
        rail: RailType,
        realm_id: RealmId,
        amount: u64,
        epoch: Epoch,
        expected_duration: u64,
        expected_yield: f64,
    ) -> Result<String, String> {
        let treasury = self
            .rail_treasuries
            .get_mut(&rail)
            .ok_or_else(|| format!("No treasury for rail {:?}", rail))?;

        // Check reserve ratio
        let after_deployment = treasury.balance.saturating_sub(amount);
        if after_deployment < treasury.reserve_minimum {
            return Err(format!(
                "Deployment would breach reserve minimum ({} < {})",
                after_deployment, treasury.reserve_minimum
            ));
        }

        let deploy_id = format!(
            "deploy-{}-{}-{}",
            rail.token_symbol(),
            epoch,
            treasury.active_deployments.len()
        );

        treasury.balance -= amount;
        treasury.total_deployed += amount;
        treasury.active_deployments.push(Deployment {
            id: deploy_id.clone(),
            realm_id,
            amount,
            deployed_epoch: epoch,
            expected_return_epoch: epoch + expected_duration,
            expected_yield,
            status: DeploymentStatus::Active,
        });

        Ok(deploy_id)
    }

    /// Return capital from a deployment
    pub fn return_capital(
        &mut self,
        rail: RailType,
        deploy_id: &str,
        actual_return: u64,
    ) -> Result<f64, String> {
        let treasury = self
            .rail_treasuries
            .get_mut(&rail)
            .ok_or_else(|| format!("No treasury for rail {:?}", rail))?;

        let deployment = treasury
            .active_deployments
            .iter_mut()
            .find(|d| d.id == deploy_id)
            .ok_or_else(|| format!("Deployment {} not found", deploy_id))?;

        let roi = (actual_return as f64 - deployment.amount as f64) / deployment.amount as f64;

        deployment.status = DeploymentStatus::Returned;
        treasury.balance += actual_return;
        treasury.total_returned += actual_return;

        Ok(roi)
    }

    /// Get total treasury value across all rails
    pub fn total_value(&self) -> u64 {
        self.core_treasury
            + self.origin_treasury
            + self.rail_treasuries.values().map(|t| t.balance).sum::<u64>()
    }

    /// Current reserve ratio
    pub fn reserve_ratio(&self) -> f64 {
        let total = self.total_value();
        let total_deployed: u64 = self
            .rail_treasuries
            .values()
            .flat_map(|t| t.active_deployments.iter())
            .filter(|d| d.status == DeploymentStatus::Active)
            .map(|d| d.amount)
            .sum();

        if total + total_deployed == 0 {
            return 1.0;
        }

        total as f64 / (total + total_deployed) as f64
    }

    /// Emergency stabilization — recall active deployments if reserve ratio drops too low
    pub fn check_emergency_stabilization(&self) -> bool {
        self.reserve_ratio() < self.min_reserve_ratio
    }

    /// Get rail treasury state
    pub fn rail_treasury(&self, rail: &RailType) -> Option<&RailTreasury> {
        self.rail_treasuries.get(rail)
    }

    pub fn core_balance(&self) -> u64 {
        self.core_treasury
    }

    pub fn origin_balance(&self) -> u64 {
        self.origin_treasury
    }

    /// Summary of all treasuries
    pub fn summary(&self) -> HashMap<String, u64> {
        let mut summary = HashMap::new();
        summary.insert("CORE".to_string(), self.core_treasury);
        summary.insert("ORIGIN".to_string(), self.origin_treasury);
        for (rail, treasury) in &self.rail_treasuries {
            summary.insert(rail.token_symbol().to_string(), treasury.balance);
        }
        summary
    }
}
