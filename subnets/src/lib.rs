//! Elastic Subnets — Avalanche-inspired with Cosmos IBC + Polkadot shared collateral
//!
//! Validators can:
//! - Join subnets temporarily
//! - Spin up sector-specific security pools
//! - Rent security from the core mesh
//! - Create custom fee markets

use gsp_kernel::{Epoch, RealmId, ValidatorId};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// A subnet definition
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Subnet {
    pub id: String,
    pub name: String,
    pub purpose: String,
    pub validators: Vec<ValidatorId>,
    pub min_validators: usize,
    pub security_deposit: u64,
    pub fee_rate: f64,
    pub realms_served: Vec<RealmId>,
    pub status: SubnetStatus,
    pub created_epoch: Epoch,
    pub lease_info: Option<SecurityLease>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum SubnetStatus {
    Active,
    Bootstrapping,
    Suspended,
    Dissolved,
}

/// Security lease from core mesh
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SecurityLease {
    pub leased_collateral: u64,
    pub lease_rate: f64,
    pub lease_start_epoch: Epoch,
    pub lease_duration_epochs: u64,
    pub auto_renew: bool,
}

/// Elastic pool manager
pub struct ElasticPool {
    subnets: HashMap<String, Subnet>,
    validator_memberships: HashMap<ValidatorId, Vec<String>>,
}

impl ElasticPool {
    pub fn new() -> Self {
        Self {
            subnets: HashMap::new(),
            validator_memberships: HashMap::new(),
        }
    }

    /// Create a new subnet
    pub fn create_subnet(
        &mut self,
        name: &str,
        purpose: &str,
        min_validators: usize,
        security_deposit: u64,
        fee_rate: f64,
        realms: Vec<RealmId>,
        epoch: Epoch,
    ) -> String {
        let id = format!("subnet-{}-{}", name.to_lowercase().replace(' ', "-"), epoch);
        let subnet = Subnet {
            id: id.clone(),
            name: name.to_string(),
            purpose: purpose.to_string(),
            validators: Vec::new(),
            min_validators,
            security_deposit,
            fee_rate,
            realms_served: realms,
            status: SubnetStatus::Bootstrapping,
            created_epoch: epoch,
            lease_info: None,
        };
        self.subnets.insert(id.clone(), subnet);
        id
    }

    /// Validator joins a subnet
    pub fn join_subnet(
        &mut self,
        subnet_id: &str,
        validator_id: ValidatorId,
    ) -> Result<(), String> {
        let subnet = self
            .subnets
            .get_mut(subnet_id)
            .ok_or("Subnet not found")?;

        if subnet.validators.contains(&validator_id) {
            return Err("Validator already in subnet".into());
        }

        subnet.validators.push(validator_id.clone());

        // Check if subnet can activate
        if subnet.validators.len() >= subnet.min_validators {
            subnet.status = SubnetStatus::Active;
        }

        self.validator_memberships
            .entry(validator_id)
            .or_insert_with(Vec::new)
            .push(subnet_id.to_string());

        Ok(())
    }

    /// Validator leaves a subnet
    pub fn leave_subnet(
        &mut self,
        subnet_id: &str,
        validator_id: &ValidatorId,
    ) -> Result<(), String> {
        let subnet = self
            .subnets
            .get_mut(subnet_id)
            .ok_or("Subnet not found")?;

        subnet.validators.retain(|v| v != validator_id);

        if subnet.validators.len() < subnet.min_validators {
            subnet.status = SubnetStatus::Suspended;
        }

        if let Some(memberships) = self.validator_memberships.get_mut(validator_id) {
            memberships.retain(|s| s != subnet_id);
        }

        Ok(())
    }

    /// Lease security from the core mesh
    pub fn lease_security(
        &mut self,
        subnet_id: &str,
        collateral: u64,
        rate: f64,
        duration: u64,
        epoch: Epoch,
    ) -> Result<(), String> {
        let subnet = self
            .subnets
            .get_mut(subnet_id)
            .ok_or("Subnet not found")?;

        subnet.lease_info = Some(SecurityLease {
            leased_collateral: collateral,
            lease_rate: rate,
            lease_start_epoch: epoch,
            lease_duration_epochs: duration,
            auto_renew: false,
        });

        Ok(())
    }

    pub fn get_subnet(&self, id: &str) -> Option<&Subnet> {
        self.subnets.get(id)
    }

    pub fn active_subnets(&self) -> Vec<&Subnet> {
        self.subnets
            .values()
            .filter(|s| s.status == SubnetStatus::Active)
            .collect()
    }

    pub fn total_subnets(&self) -> usize {
        self.subnets.len()
    }
}
