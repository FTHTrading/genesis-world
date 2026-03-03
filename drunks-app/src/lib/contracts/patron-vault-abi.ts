// ═══════════════════════════════════════════════
// PatronVault ABI — Minimal interface for frontend
// Full contract: contracts-evm/contracts/PatronVault.sol
// ═══════════════════════════════════════════════

export const PATRON_VAULT_ABI = [
  // ── Read functions ──
  {
    type: "function",
    name: "totalDeposited",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "totalPositions",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "totalCoreDistributed",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "rewardRatePerSecond",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "nextPositionId",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "tiers",
    inputs: [{ name: "", type: "uint256" }],
    outputs: [
      { name: "lockDuration", type: "uint256" },
      { name: "multiplier", type: "uint256" },
      { name: "label", type: "string" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "positions",
    inputs: [{ name: "", type: "uint256" }],
    outputs: [
      { name: "id", type: "uint256" },
      { name: "depositedMatic", type: "uint256" },
      { name: "lockStart", type: "uint256" },
      { name: "lockEnd", type: "uint256" },
      { name: "tierIndex", type: "uint8" },
      { name: "active", type: "bool" },
      { name: "patron", type: "address" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getPatronPositions",
    inputs: [{ name: "patron", type: "address" }],
    outputs: [{ name: "", type: "uint256[]" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "calculateReward",
    inputs: [{ name: "positionId", type: "uint256" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getTier",
    inputs: [{ name: "index", type: "uint8" }],
    outputs: [
      { name: "lockDuration", type: "uint256" },
      { name: "multiplier", type: "uint256" },
      { name: "label", type: "string" },
    ],
    stateMutability: "view",
  },
  // ── Write functions ──
  {
    type: "function",
    name: "deposit",
    inputs: [{ name: "tierIndex", type: "uint8" }],
    outputs: [],
    stateMutability: "payable",
  },
  {
    type: "function",
    name: "withdraw",
    inputs: [{ name: "positionId", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "emergencyWithdraw",
    inputs: [{ name: "positionId", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  // ── Events ──
  {
    type: "event",
    name: "Deposited",
    inputs: [
      { name: "patron", type: "address", indexed: true },
      { name: "positionId", type: "uint256", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
      { name: "tierIndex", type: "uint8", indexed: false },
      { name: "lockEnd", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "Withdrawn",
    inputs: [
      { name: "patron", type: "address", indexed: true },
      { name: "positionId", type: "uint256", indexed: true },
      { name: "maticReturned", type: "uint256", indexed: false },
      { name: "coreRewarded", type: "uint256", indexed: false },
      { name: "earlyExit", type: "bool", indexed: false },
    ],
  },
] as const;
