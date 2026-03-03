//! Staking Engine — Core + realm + subnet staking

use gsp_kernel::{Epoch, RealmId, ValidatorId};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Staking position
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StakePosition {
    pub validator_id: ValidatorId,
    pub core_stake: u64,
    pub realm_stakes: HashMap<RealmId, u64>,
    pub total_rewards: u64,
    pub total_slashed: u64,
    pub bonding_epoch: Epoch,
    pub unbonding_epoch: Option<Epoch>,
}

/// The Staking Engine
pub struct StakingEngine {
    positions: HashMap<ValidatorId, StakePosition>,
    unbonding_period: u64,
    min_stake: u64,
    total_staked: u64,
}

impl StakingEngine {
    pub fn new(unbonding_period: u64, min_stake: u64) -> Self {
        Self {
            positions: HashMap::new(),
            unbonding_period,
            min_stake,
            total_staked: 0,
        }
    }

    /// Stake to core
    pub fn stake_core(
        &mut self,
        validator_id: ValidatorId,
        amount: u64,
        epoch: Epoch,
    ) -> Result<(), String> {
        if amount < self.min_stake {
            return Err(format!("Stake {} below minimum {}", amount, self.min_stake));
        }

        let position = self
            .positions
            .entry(validator_id.clone())
            .or_insert_with(|| StakePosition {
                validator_id,
                core_stake: 0,
                realm_stakes: HashMap::new(),
                total_rewards: 0,
                total_slashed: 0,
                bonding_epoch: epoch,
                unbonding_epoch: None,
            });

        position.core_stake += amount;
        self.total_staked += amount;
        Ok(())
    }

    /// Stake to a specific realm
    pub fn stake_realm(
        &mut self,
        validator_id: &ValidatorId,
        realm_id: RealmId,
        amount: u64,
    ) -> Result<(), String> {
        let position = self
            .positions
            .get_mut(validator_id)
            .ok_or("Validator not found")?;

        *position.realm_stakes.entry(realm_id).or_insert(0) += amount;
        self.total_staked += amount;
        Ok(())
    }

    /// Distribute staking rewards
    pub fn distribute_rewards(&mut self, total_reward: u64) {
        if self.total_staked == 0 {
            return;
        }
        for position in self.positions.values_mut() {
            let share = position.core_stake as f64 / self.total_staked as f64;
            let reward = (total_reward as f64 * share) as u64;
            position.total_rewards += reward;
            position.core_stake += reward;
        }
        self.total_staked += total_reward;
    }

    /// Slash a validator
    pub fn slash(&mut self, validator_id: &ValidatorId, amount: u64) -> u64 {
        if let Some(position) = self.positions.get_mut(validator_id) {
            let actual = amount.min(position.core_stake);
            position.core_stake -= actual;
            position.total_slashed += actual;
            self.total_staked -= actual;
            actual
        } else {
            0
        }
    }

    pub fn total_staked(&self) -> u64 {
        self.total_staked
    }

    pub fn validator_count(&self) -> usize {
        self.positions.len()
    }

    pub fn get_position(&self, validator_id: &ValidatorId) -> Option<&StakePosition> {
        self.positions.get(validator_id)
    }
}
