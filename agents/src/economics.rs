//! Agent Economics — Skin in the game
//!
//! Each agent:
//! - Pays compute gas for every action
//! - Holds a staking balance
//! - Can earn rewards from successful decisions
//! - Can be slashed for harmful proposals
//!
//! Even AI has economic cost in this civilization.

use gsp_kernel::Epoch;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Agent's economic account
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentEconomics {
    pub agent_id: String,
    /// Staking balance in $CORE
    pub staking_balance: u64,
    /// Compute credits available
    pub compute_credits: u64,
    /// Total rewards earned
    pub total_rewards: u64,
    /// Total slashed
    pub total_slashed: u64,
    /// Total compute spent
    pub total_compute_spent: u64,
    /// Revenue generated for realm
    pub revenue_generated: i64,
    /// Transaction history
    pub transactions: Vec<EconomicTransaction>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EconomicTransaction {
    pub epoch: Epoch,
    pub tx_type: TransactionType,
    pub amount: u64,
    pub description: String,
    pub balance_after: u64,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub enum TransactionType {
    ComputeGas,
    StakingReward,
    DecisionReward,
    Slash,
    Grant,
    ComputeCredit,
    RevenueShare,
}

impl AgentEconomics {
    pub fn new(agent_id: String, initial_stake: u64, initial_compute: u64) -> Self {
        Self {
            agent_id,
            staking_balance: initial_stake,
            compute_credits: initial_compute,
            total_rewards: 0,
            total_slashed: 0,
            total_compute_spent: 0,
            revenue_generated: 0,
            transactions: Vec::new(),
        }
    }

    /// Pay compute gas for an action
    pub fn pay_compute(&mut self, amount: u64, epoch: Epoch, description: &str) -> Result<(), String> {
        if self.compute_credits < amount {
            return Err(format!(
                "Insufficient compute credits: have {}, need {}",
                self.compute_credits, amount
            ));
        }
        self.compute_credits -= amount;
        self.total_compute_spent += amount;
        self.transactions.push(EconomicTransaction {
            epoch,
            tx_type: TransactionType::ComputeGas,
            amount,
            description: description.to_string(),
            balance_after: self.compute_credits,
        });
        Ok(())
    }

    /// Receive staking reward
    pub fn receive_reward(&mut self, amount: u64, epoch: Epoch) {
        self.staking_balance += amount;
        self.total_rewards += amount;
        self.transactions.push(EconomicTransaction {
            epoch,
            tx_type: TransactionType::StakingReward,
            amount,
            description: "Epoch staking reward".to_string(),
            balance_after: self.staking_balance,
        });
    }

    /// Get slashed
    pub fn slash(&mut self, amount: u64, epoch: Epoch, reason: &str) -> u64 {
        let actual_slash = amount.min(self.staking_balance);
        self.staking_balance -= actual_slash;
        self.total_slashed += actual_slash;
        self.transactions.push(EconomicTransaction {
            epoch,
            tx_type: TransactionType::Slash,
            amount: actual_slash,
            description: format!("Slashed: {}", reason),
            balance_after: self.staking_balance,
        });
        actual_slash
    }

    /// Receive compute credit grant
    pub fn receive_compute_grant(&mut self, amount: u64, epoch: Epoch) {
        self.compute_credits += amount;
        self.transactions.push(EconomicTransaction {
            epoch,
            tx_type: TransactionType::ComputeCredit,
            amount,
            description: "Compute credit grant".to_string(),
            balance_after: self.compute_credits,
        });
    }

    /// Record decision reward
    pub fn decision_reward(&mut self, amount: u64, epoch: Epoch, decision_desc: &str) {
        self.staking_balance += amount;
        self.total_rewards += amount;
        self.revenue_generated += amount as i64;
        self.transactions.push(EconomicTransaction {
            epoch,
            tx_type: TransactionType::DecisionReward,
            amount,
            description: format!("Decision reward: {}", decision_desc),
            balance_after: self.staking_balance,
        });
    }

    /// Net economic value of this agent
    pub fn net_value(&self) -> i64 {
        self.total_rewards as i64 - self.total_slashed as i64
    }

    /// ROI calculation
    pub fn roi(&self, initial_stake: u64) -> f64 {
        if initial_stake == 0 {
            return 0.0;
        }
        (self.staking_balance as f64 - initial_stake as f64) / initial_stake as f64
    }
}
