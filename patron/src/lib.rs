//! Patron Protocol — Agent Sponsorship & Capital Layer
//!
//! The Patron Protocol lets external capital flow **into** individual agents:
//! - Backers deposit $CORE into per-agent vaults
//! - Share-based accounting (deposit → minted shares, withdraw → burned shares)
//! - Deterministic performance scoring each epoch
//! - Epoch settlement distributes rewards pro-rata to backers
//! - Proof roots for on-chain anchoring
//! - Patron tiers & leaderboard
//!
//! This is the layer that turns GSP from a research engine into a **capital engine**.

use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::collections::HashMap;

// ───── Configuration ─────

/// Protocol-level configuration for the Patron system
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PatronConfig {
    /// How many epochs a deposit is locked before withdrawal
    pub withdrawal_lock_epochs: u64,
    /// Basis points of total emission allocated to patron reward pool (e.g. 1500 = 15%)
    pub patron_pool_bps: u64,
    /// Minimum score floor — agents below this earn zero patron rewards
    pub min_score_floor: f64,
    /// Maximum principal any single vault can hold
    pub max_agent_vault_principal: u64,
    /// Score weights: [yield, volatility, invariant_penalty, governance_bonus]
    pub score_weights: [f64; 4],
}

impl Default for PatronConfig {
    fn default() -> Self {
        Self {
            withdrawal_lock_epochs: 3,
            patron_pool_bps: 1500,
            min_score_floor: 0.05,
            max_agent_vault_principal: 10_000_000,
            score_weights: [1.0, 0.5, 2.0, 0.3],
        }
    }
}

// ───── Core Types ─────

/// A backer's position in a specific agent's vault
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PatronPosition {
    /// Backer account identifier
    pub account_id: String,
    /// The agent being backed
    pub agent_id: String,
    /// Share count (minted at deposit, burned at withdrawal)
    pub shares: u64,
    /// Total $CORE deposited (lifetime, not current — current = shares * share_price)
    pub deposited: u64,
    /// Pending rewards available to claim
    pub pending_rewards: u64,
    /// Epoch at which withdrawal becomes unlocked
    pub lock_until_epoch: u64,
    /// Epoch the position was opened
    pub opened_epoch: u64,
}

/// Per-agent vault aggregating all backer capital
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentVault {
    /// The agent this vault belongs to
    pub agent_id: String,
    /// Total $CORE principal in the vault
    pub total_principal: u64,
    /// Total outstanding shares
    pub total_shares: u64,
    /// Latest performance score (computed each epoch)
    pub performance_score: f64,
    /// Lifetime rewards distributed through this vault
    pub lifetime_rewards: u64,
}

impl AgentVault {
    fn new(agent_id: String) -> Self {
        Self {
            agent_id,
            total_principal: 0,
            total_shares: 0,
            performance_score: 0.0,
            lifetime_rewards: 0,
        }
    }

    /// Price per share — 1:1 if vault is empty (bootstrap)
    pub fn share_price(&self) -> f64 {
        if self.total_shares == 0 {
            1.0
        } else {
            self.total_principal as f64 / self.total_shares as f64
        }
    }
}

/// Input metrics for scoring an agent's epoch performance
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentEpochMetrics {
    pub agent_id: String,
    /// Treasury delta in basis points (positive = growth)
    pub treasury_delta_bps: i64,
    /// Volatility in basis points (higher = riskier)
    pub volatility_bps: u64,
    /// Constitutional invariant pressure (0.0 = none, 1.0 = critical)
    pub invariant_pressure: f64,
    /// Governance proposal success rate (0.0–1.0)
    pub proposal_success_rate: f64,
}

/// Settlement report produced after each epoch
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PatronSettlementReport {
    pub epoch: u64,
    /// Total reward pool distributed this epoch
    pub total_pool: u64,
    /// Per-agent reward allocations
    pub agent_rewards: HashMap<String, u64>,
    /// Number of backers who received rewards
    pub backers_rewarded: usize,
    /// Proof roots for this settlement
    pub proof_roots: PatronProofRoots,
    /// Agent scores this epoch
    pub agent_scores: HashMap<String, f64>,
}

/// Merkle-style proof roots for patron settlement
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PatronProofRoots {
    /// Hash of all vault states
    pub vault_root: String,
    /// Hash of all position states
    pub position_root: String,
    /// Hash of settlement distribution
    pub settlement_root: String,
    /// Combined root
    pub combined_root: String,
}

/// Patron tier based on total capital deployed
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Serialize, Deserialize)]
pub enum PatronTier {
    /// < 1,000 $CORE
    Observer,
    /// ≥ 1,000 $CORE
    Supporter,
    /// ≥ 10,000 $CORE
    Patron,
    /// ≥ 50,000 $CORE
    Strategist,
    /// ≥ 100,000 $CORE
    Architect,
}

impl PatronTier {
    pub fn from_total_deposited(amount: u64) -> Self {
        match amount {
            a if a >= 100_000 => PatronTier::Architect,
            a if a >= 50_000 => PatronTier::Strategist,
            a if a >= 10_000 => PatronTier::Patron,
            a if a >= 1_000 => PatronTier::Supporter,
            _ => PatronTier::Observer,
        }
    }

    pub fn label(&self) -> &'static str {
        match self {
            PatronTier::Observer => "OBSERVER",
            PatronTier::Supporter => "SUPPORTER",
            PatronTier::Patron => "PATRON",
            PatronTier::Strategist => "STRATEGIST",
            PatronTier::Architect => "ARCHITECT",
        }
    }
}

/// Leaderboard entry for a patron account
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PatronLeaderboardEntry {
    pub account_id: String,
    pub total_deposited: u64,
    pub total_rewards: u64,
    pub agents_backed: usize,
    pub tier: PatronTier,
}

// ───── Patron Engine ─────

/// Main engine managing all patron positions, vaults, scoring, and settlement
#[derive(Debug, Clone)]
pub struct PatronEngine {
    pub config: PatronConfig,
    /// Per-agent vaults: agent_id → AgentVault
    pub vaults: HashMap<String, AgentVault>,
    /// All patron positions: (account_id, agent_id) → PatronPosition
    pub positions: HashMap<(String, String), PatronPosition>,
    /// Current epoch
    pub current_epoch: u64,
    /// History of settlement reports
    pub settlement_history: Vec<PatronSettlementReport>,
}

impl PatronEngine {
    pub fn new(config: PatronConfig) -> Self {
        Self {
            config,
            vaults: HashMap::new(),
            positions: HashMap::new(),
            current_epoch: 0,
            settlement_history: Vec::new(),
        }
    }

    /// Deposit $CORE into an agent's vault
    ///
    /// Returns the number of shares minted.
    pub fn deposit(
        &mut self,
        account_id: &str,
        agent_id: &str,
        amount: u64,
        epoch: u64,
    ) -> Result<u64, String> {
        if amount == 0 {
            return Err("Deposit amount must be > 0".into());
        }

        let vault = self
            .vaults
            .entry(agent_id.to_string())
            .or_insert_with(|| AgentVault::new(agent_id.to_string()));

        if vault.total_principal + amount > self.config.max_agent_vault_principal {
            return Err(format!(
                "Vault cap exceeded: {} + {} > {}",
                vault.total_principal, amount, self.config.max_agent_vault_principal
            ));
        }

        // Compute shares: if vault is empty → 1:1, otherwise pro-rata
        let shares = if vault.total_shares == 0 {
            amount
        } else {
            (amount as u128 * vault.total_shares as u128 / vault.total_principal as u128) as u64
        };

        vault.total_principal += amount;
        vault.total_shares += shares;

        let key = (account_id.to_string(), agent_id.to_string());
        let position = self.positions.entry(key).or_insert_with(|| PatronPosition {
            account_id: account_id.to_string(),
            agent_id: agent_id.to_string(),
            shares: 0,
            deposited: 0,
            pending_rewards: 0,
            lock_until_epoch: epoch + self.config.withdrawal_lock_epochs,
            opened_epoch: epoch,
        });

        position.shares += shares;
        position.deposited += amount;
        position.lock_until_epoch = epoch + self.config.withdrawal_lock_epochs;

        Ok(shares)
    }

    /// Withdraw $CORE from an agent's vault (burns shares)
    ///
    /// Returns the $CORE amount returned to the backer.
    pub fn withdraw(
        &mut self,
        account_id: &str,
        agent_id: &str,
        shares_to_burn: u64,
        epoch: u64,
    ) -> Result<u64, String> {
        let key = (account_id.to_string(), agent_id.to_string());
        let position = self
            .positions
            .get_mut(&key)
            .ok_or_else(|| "No position found".to_string())?;

        if epoch < position.lock_until_epoch {
            return Err(format!(
                "Position locked until epoch {} (current: {})",
                position.lock_until_epoch, epoch
            ));
        }

        if shares_to_burn > position.shares {
            return Err(format!(
                "Insufficient shares: have {}, want to burn {}",
                position.shares, shares_to_burn
            ));
        }

        let vault = self
            .vaults
            .get_mut(agent_id)
            .ok_or_else(|| "No vault found".to_string())?;

        // Calculate $CORE value of the shares being burned
        let core_out =
            (shares_to_burn as u128 * vault.total_principal as u128 / vault.total_shares as u128)
                as u64;

        vault.total_shares -= shares_to_burn;
        vault.total_principal -= core_out;
        position.shares -= shares_to_burn;

        // Clean up empty positions
        if position.shares == 0 {
            self.positions.remove(&key);
        }

        // Clean up empty vaults
        if vault.total_shares == 0 {
            self.vaults.remove(agent_id);
        }

        Ok(core_out)
    }

    /// Set performance scores from epoch metrics
    ///
    /// Score formula: max(0, w1*yield - w2*volatility - w3*invariant_penalty + w4*governance_bonus)
    pub fn set_scores(&mut self, metrics: &[AgentEpochMetrics]) {
        let [w1, w2, w3, w4] = self.config.score_weights;

        for m in metrics {
            let yield_component = m.treasury_delta_bps as f64 / 10_000.0;
            let volatility_component = m.volatility_bps as f64 / 10_000.0;
            let invariant_component = m.invariant_pressure;
            let governance_component = m.proposal_success_rate;

            let raw_score = w1 * yield_component
                - w2 * volatility_component
                - w3 * invariant_component
                + w4 * governance_component;

            let score = raw_score.max(0.0);

            if let Some(vault) = self.vaults.get_mut(&m.agent_id) {
                vault.performance_score = score;
            }
        }
    }

    /// Settle an epoch: distribute rewards from the patron pool to backers
    ///
    /// `total_epoch_emission` is the total $CORE emitted this epoch;
    /// the patron pool is `total_epoch_emission * patron_pool_bps / 10_000`.
    pub fn settle_epoch(
        &mut self,
        epoch: u64,
        total_epoch_emission: u64,
    ) -> PatronSettlementReport {
        self.current_epoch = epoch;

        let pool =
            (total_epoch_emission as u128 * self.config.patron_pool_bps as u128 / 10_000) as u64;

        // Collect scored vaults
        let scored_vaults: Vec<(String, f64)> = self
            .vaults
            .iter()
            .filter(|(_, v)| v.performance_score >= self.config.min_score_floor)
            .map(|(id, v)| (id.clone(), v.performance_score))
            .collect();

        let total_score: f64 = scored_vaults.iter().map(|(_, s)| s).sum();

        let mut agent_rewards: HashMap<String, u64> = HashMap::new();
        let mut backers_rewarded: usize = 0;
        let mut agent_scores: HashMap<String, f64> = HashMap::new();

        for (agent_id, score) in &scored_vaults {
            agent_scores.insert(agent_id.clone(), *score);

            if total_score <= 0.0 {
                continue;
            }

            let agent_reward = (pool as f64 * score / total_score) as u64;
            agent_rewards.insert(agent_id.clone(), agent_reward);

            // Distribute pro-rata to backers of this agent
            let vault = match self.vaults.get(agent_id) {
                Some(v) => v,
                None => continue,
            };

            if vault.total_shares == 0 {
                continue;
            }

            // Collect positions for this agent, distribute proportionally
            let agent_positions: Vec<(String, String)> = self
                .positions
                .keys()
                .filter(|(_, aid)| aid == agent_id)
                .cloned()
                .collect();

            for key in &agent_positions {
                if let Some(position) = self.positions.get_mut(key) {
                    let backer_reward = (agent_reward as u128 * position.shares as u128
                        / vault.total_shares as u128) as u64;
                    position.pending_rewards += backer_reward;
                    backers_rewarded += 1;
                }
            }

            // Update vault lifetime rewards
            if let Some(v) = self.vaults.get_mut(agent_id) {
                v.lifetime_rewards += agent_reward;
            }
        }

        // Also store scores for agents that didn't meet the floor
        for (id, vault) in &self.vaults {
            agent_scores.entry(id.clone()).or_insert(vault.performance_score);
        }

        let proof_roots = self.compute_roots();

        let report = PatronSettlementReport {
            epoch,
            total_pool: pool,
            agent_rewards,
            backers_rewarded,
            proof_roots,
            agent_scores,
        };

        self.settlement_history.push(report.clone());
        report
    }

    /// Claim pending rewards for a backer position
    ///
    /// Returns the amount claimed.
    pub fn claim(&mut self, account_id: &str, agent_id: &str) -> Result<u64, String> {
        let key = (account_id.to_string(), agent_id.to_string());
        let position = self
            .positions
            .get_mut(&key)
            .ok_or_else(|| "No position found".to_string())?;

        let amount = position.pending_rewards;
        position.pending_rewards = 0;
        Ok(amount)
    }

    /// Compute proof roots for the current state
    pub fn compute_roots(&self) -> PatronProofRoots {
        let vault_root = self.hash_vaults();
        let position_root = self.hash_positions();
        let settlement_root = self.hash_settlements();

        let combined = {
            let mut hasher = Sha256::new();
            hasher.update(vault_root.as_bytes());
            hasher.update(position_root.as_bytes());
            hasher.update(settlement_root.as_bytes());
            hex::encode(hasher.finalize())
        };

        PatronProofRoots {
            vault_root,
            position_root,
            settlement_root,
            combined_root: combined,
        }
    }

    /// Build the patron leaderboard sorted by total deposited (descending)
    pub fn leaderboard(&self) -> Vec<PatronLeaderboardEntry> {
        let mut account_map: HashMap<String, (u64, u64, usize)> = HashMap::new();

        for ((account_id, _), position) in &self.positions {
            let entry = account_map
                .entry(account_id.clone())
                .or_insert((0, 0, 0));
            entry.0 += position.deposited;
            entry.1 += position.pending_rewards;
            entry.2 += 1;
        }

        let mut board: Vec<PatronLeaderboardEntry> = account_map
            .into_iter()
            .map(|(account_id, (total_deposited, total_rewards, agents_backed))| {
                PatronLeaderboardEntry {
                    account_id,
                    total_deposited,
                    total_rewards,
                    agents_backed,
                    tier: PatronTier::from_total_deposited(total_deposited),
                }
            })
            .collect();

        board.sort_by(|a, b| b.total_deposited.cmp(&a.total_deposited));
        board
    }

    /// Total capital across all vaults
    pub fn total_capital(&self) -> u64 {
        self.vaults.values().map(|v| v.total_principal).sum()
    }

    /// Total number of unique backers
    pub fn total_backers(&self) -> usize {
        self.positions
            .keys()
            .map(|(a, _)| a.clone())
            .collect::<std::collections::HashSet<_>>()
            .len()
    }

    /// Total number of active vaults
    pub fn total_vaults(&self) -> usize {
        self.vaults.len()
    }

    // ── Internal helpers ──

    fn hash_vaults(&self) -> String {
        let mut hasher = Sha256::new();
        let mut sorted: Vec<_> = self.vaults.iter().collect();
        sorted.sort_by_key(|(id, _)| (*id).clone());
        for (id, vault) in sorted {
            hasher.update(id.as_bytes());
            hasher.update(vault.total_principal.to_le_bytes());
            hasher.update(vault.total_shares.to_le_bytes());
            hasher.update(vault.performance_score.to_le_bytes());
            hasher.update(vault.lifetime_rewards.to_le_bytes());
        }
        hex::encode(hasher.finalize())
    }

    fn hash_positions(&self) -> String {
        let mut hasher = Sha256::new();
        let mut sorted: Vec<_> = self.positions.iter().collect();
        sorted.sort_by_key(|(k, _)| (k.0.clone(), k.1.clone()));
        for ((account, agent), pos) in sorted {
            hasher.update(account.as_bytes());
            hasher.update(agent.as_bytes());
            hasher.update(pos.shares.to_le_bytes());
            hasher.update(pos.deposited.to_le_bytes());
            hasher.update(pos.pending_rewards.to_le_bytes());
            hasher.update(pos.lock_until_epoch.to_le_bytes());
        }
        hex::encode(hasher.finalize())
    }

    fn hash_settlements(&self) -> String {
        let mut hasher = Sha256::new();
        for report in &self.settlement_history {
            hasher.update(report.epoch.to_le_bytes());
            hasher.update(report.total_pool.to_le_bytes());
            hasher.update(report.backers_rewarded.to_le_bytes());
        }
        hex::encode(hasher.finalize())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_deposit_and_withdraw() {
        let mut engine = PatronEngine::new(PatronConfig::default());

        // Deposit
        let shares = engine.deposit("alice", "agent-0", 5_000, 0).unwrap();
        assert_eq!(shares, 5_000); // first deposit → 1:1

        let shares2 = engine.deposit("bob", "agent-0", 3_000, 0).unwrap();
        assert_eq!(shares2, 3_000);

        assert_eq!(engine.vaults["agent-0"].total_principal, 8_000);
        assert_eq!(engine.vaults["agent-0"].total_shares, 8_000);

        // Withdraw (must wait for lock)
        assert!(engine.withdraw("alice", "agent-0", 1_000, 0).is_err());
        let core_out = engine.withdraw("alice", "agent-0", 1_000, 5).unwrap();
        assert_eq!(core_out, 1_000);
    }

    #[test]
    fn test_scoring_and_settlement() {
        let mut engine = PatronEngine::new(PatronConfig::default());
        engine.deposit("alice", "agent-0", 10_000, 0).unwrap();
        engine.deposit("bob", "agent-1", 5_000, 0).unwrap();

        engine.set_scores(&[
            AgentEpochMetrics {
                agent_id: "agent-0".into(),
                treasury_delta_bps: 300,
                volatility_bps: 50,
                invariant_pressure: 0.0,
                proposal_success_rate: 0.8,
            },
            AgentEpochMetrics {
                agent_id: "agent-1".into(),
                treasury_delta_bps: 150,
                volatility_bps: 100,
                invariant_pressure: 0.1,
                proposal_success_rate: 0.5,
            },
        ]);

        let report = engine.settle_epoch(1, 100_000);
        assert!(report.total_pool > 0);
        assert!(report.agent_rewards.len() > 0);
    }

    #[test]
    fn test_patron_tiers() {
        assert_eq!(PatronTier::from_total_deposited(500), PatronTier::Observer);
        assert_eq!(PatronTier::from_total_deposited(1_000), PatronTier::Supporter);
        assert_eq!(PatronTier::from_total_deposited(10_000), PatronTier::Patron);
        assert_eq!(PatronTier::from_total_deposited(50_000), PatronTier::Strategist);
        assert_eq!(PatronTier::from_total_deposited(100_000), PatronTier::Architect);
    }

    #[test]
    fn test_leaderboard() {
        let mut engine = PatronEngine::new(PatronConfig::default());
        engine.deposit("whale", "agent-0", 100_000, 0).unwrap();
        engine.deposit("whale", "agent-1", 50_000, 0).unwrap();
        engine.deposit("small", "agent-0", 2_000, 0).unwrap();

        let board = engine.leaderboard();
        assert_eq!(board.len(), 2);
        assert_eq!(board[0].account_id, "whale");
        assert_eq!(board[0].tier, PatronTier::Architect);
        assert_eq!(board[1].account_id, "small");
        assert_eq!(board[1].tier, PatronTier::Supporter);
    }

    #[test]
    fn test_proof_roots_deterministic() {
        let mut engine = PatronEngine::new(PatronConfig::default());
        engine.deposit("alice", "agent-0", 5_000, 0).unwrap();

        let roots1 = engine.compute_roots();
        let roots2 = engine.compute_roots();
        assert_eq!(roots1.combined_root, roots2.combined_root);
    }
}
