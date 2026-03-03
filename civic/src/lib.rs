//! # GSP-CIVIC — Moltbook Protocol
//!
//! The hybrid communication and civilizational memory layer for Genesis Sentience Protocol.
//!
//! Every civilization that survives builds archives.
//! Every archive becomes power.
//!
//! ## Architecture
//!
//! - **Thread Registry**: Typed threads with metadata, proof anchoring, and lifecycle
//! - **Role Hierarchy**: Constitutional → Governance → Operations → Citizens
//! - **Debate Graph**: Merkle-anchored DAG of claims, evidence, and decisions
//! - **Precedent Index**: Historical reference engine for AI agent decision-making
//! - **Reputation Engine**: Merit-based scoring (signal quality, not volume)

pub mod threads;
pub mod hierarchy;
pub mod debate;
pub mod precedent;
pub mod reputation;

pub use threads::*;
pub use hierarchy::*;
pub use debate::*;
pub use precedent::*;
pub use reputation::*;
