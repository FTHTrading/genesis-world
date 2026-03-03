"use client";

import { useState, useEffect } from "react";
import { useAccount, useReadContract, useReadContracts, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther, formatEther, type Address } from "viem";
import { CONTRACTS, PATRON_VAULT_ABI, POLYGONSCAN_BASE } from "@/lib/contracts";

// ═══════════════════════════════════════════════
// PatronVault — Capital Lock Interface
// Deposit POL. Choose your tier. Earn $CORE.
// ═══════════════════════════════════════════════

const TIERS = [
  { index: 0, label: "BRONZE",   duration: "30 DAYS",  multiplier: "1×",  color: "#CD7F32", bgAlpha: "rgba(205,127,50,0.08)",  borderAlpha: "rgba(205,127,50,0.3)",  hoverBg: "rgba(205,127,50,0.15)" },
  { index: 1, label: "SILVER",   duration: "90 DAYS",  multiplier: "2×",  color: "#C0C0C0", bgAlpha: "rgba(192,192,192,0.08)", borderAlpha: "rgba(192,192,192,0.3)", hoverBg: "rgba(192,192,192,0.15)" },
  { index: 2, label: "GOLD",     duration: "180 DAYS", multiplier: "3×",  color: "#FFD700", bgAlpha: "rgba(255,215,0,0.08)",   borderAlpha: "rgba(255,215,0,0.3)",   hoverBg: "rgba(255,215,0,0.15)" },
  { index: 3, label: "PLATINUM", duration: "365 DAYS", multiplier: "5×",  color: "#E5E4E2", bgAlpha: "rgba(229,228,226,0.08)", borderAlpha: "rgba(229,228,226,0.3)", hoverBg: "rgba(229,228,226,0.15)" },
];

const VAULT_ADDRESS = CONTRACTS.PATRON_VAULT as Address;

function formatCountdown(seconds: number): string {
  if (seconds <= 0) return "MATURED";
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

// ── Position Card ──────────────────────────────────────────
function PositionCard({
  positionId,
  onWithdraw,
  withdrawingId,
}: {
  positionId: bigint;
  onWithdraw: (id: bigint, emergency: boolean) => void;
  withdrawingId: bigint | null;
}) {
  const [now, setNow] = useState(Math.floor(Date.now() / 1000));

  useEffect(() => {
    const interval = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(interval);
  }, []);

  const { data: posData } = useReadContract({
    address: VAULT_ADDRESS,
    abi: PATRON_VAULT_ABI,
    functionName: "positions",
    args: [positionId],
  });

  const { data: pendingReward } = useReadContract({
    address: VAULT_ADDRESS,
    abi: PATRON_VAULT_ABI,
    functionName: "calculateReward",
    args: [positionId],
  });

  if (!posData) return null;

  const [id, depositedMatic, lockStart, lockEnd, tierIndex, active] = posData as [bigint, bigint, bigint, bigint, number, boolean, Address];

  if (!active) return null;

  const tier = TIERS[tierIndex] || TIERS[0];
  const remaining = Number(lockEnd) - now;
  const matured = remaining <= 0;
  const totalDuration = Number(lockEnd) - Number(lockStart);
  const elapsed = now - Number(lockStart);
  const progress = Math.min(100, (elapsed / totalDuration) * 100);
  const isWithdrawing = withdrawingId === positionId;

  return (
    <div
      className="glass-panel p-5 space-y-4"
      style={{ borderColor: tier.borderAlpha }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span
            className="text-[0.65rem] font-mono font-bold tracking-widest px-2 py-0.5 rounded"
            style={{ color: tier.color, background: tier.bgAlpha, border: `1px solid ${tier.borderAlpha}` }}
          >
            {tier.label}
          </span>
          <span className="text-[0.65rem] font-mono text-[var(--text-muted)]">
            #{id.toString()}
          </span>
        </div>
        {matured ? (
          <span className="text-[0.65rem] font-mono font-bold text-[var(--accent-green)] tracking-wider animate-pulse-glow">
            MATURED
          </span>
        ) : (
          <span className="text-[0.65rem] font-mono text-[var(--text-secondary)] tracking-wider">
            {formatCountdown(remaining)}
          </span>
        )}
      </div>

      {/* Deposit Amount */}
      <div>
        <div className="text-[0.6rem] font-mono text-[var(--text-muted)] tracking-wider mb-1">DEPOSITED</div>
        <div className="text-lg font-mono font-bold text-[var(--text-primary)]">
          {parseFloat(formatEther(depositedMatic)).toFixed(2)} <span className="text-[0.7rem] text-[var(--text-secondary)]">POL</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div>
        <div className="dna-bar">
          <div
            className="dna-bar-fill"
            style={{
              width: `${progress}%`,
              background: matured ? "var(--accent-green)" : tier.color,
            }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[0.55rem] font-mono text-[var(--text-muted)]">{progress.toFixed(0)}%</span>
          <span className="text-[0.55rem] font-mono text-[var(--text-muted)]">{tier.multiplier} REWARD</span>
        </div>
      </div>

      {/* Pending Reward */}
      <div className="flex items-center justify-between">
        <span className="text-[0.6rem] font-mono text-[var(--text-muted)] tracking-wider">PENDING $CORE</span>
        <span className="text-sm font-mono font-bold text-[var(--accent-green)]">
          {pendingReward ? parseFloat(formatEther(pendingReward as bigint)).toFixed(4) : "—"}
        </span>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => onWithdraw(positionId, false)}
          disabled={isWithdrawing}
          className="flex-1 py-2 text-[0.7rem] font-mono font-bold tracking-widest rounded transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            color: matured ? "#0B0F1A" : tier.color,
            background: matured ? "var(--accent-green)" : tier.bgAlpha,
            border: `1px solid ${matured ? "var(--accent-green)" : tier.borderAlpha}`,
          }}
        >
          {isWithdrawing ? "PROCESSING..." : matured ? "CLAIM" : "WITHDRAW (10% PENALTY)"}
        </button>
        {!matured && (
          <button
            onClick={() => onWithdraw(positionId, true)}
            disabled={isWithdrawing}
            className="py-2 px-3 text-[0.65rem] font-mono tracking-widest rounded border border-[rgba(231,76,60,0.3)] text-[var(--accent-crimson)] bg-[rgba(231,76,60,0.08)] hover:bg-[rgba(231,76,60,0.15)] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            title="Emergency withdraw — returns POL only, no $CORE rewards"
          >
            EXIT
          </button>
        )}
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────
export default function VaultPage() {
  const { address, isConnected } = useAccount();
  const [selectedTier, setSelectedTier] = useState<number>(0);
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawingId, setWithdrawingId] = useState<bigint | null>(null);

  // ── Protocol stats ──
  const { data: totalDeposited } = useReadContract({
    address: VAULT_ADDRESS,
    abi: PATRON_VAULT_ABI,
    functionName: "totalDeposited",
  });

  const { data: totalPositions } = useReadContract({
    address: VAULT_ADDRESS,
    abi: PATRON_VAULT_ABI,
    functionName: "totalPositions",
  });

  const { data: totalCoreDistributed } = useReadContract({
    address: VAULT_ADDRESS,
    abi: PATRON_VAULT_ABI,
    functionName: "totalCoreDistributed",
  });

  // ── User positions ──
  const { data: userPositionIds, refetch: refetchPositions } = useReadContract({
    address: VAULT_ADDRESS,
    abi: PATRON_VAULT_ABI,
    functionName: "getPatronPositions",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  // ── Deposit ──
  const { writeContract: doDeposit, data: depositHash, isPending: isDepositing } = useWriteContract();
  const { isSuccess: depositConfirmed } = useWaitForTransactionReceipt({ hash: depositHash });

  useEffect(() => {
    if (depositConfirmed) {
      setDepositAmount("");
      refetchPositions();
    }
  }, [depositConfirmed, refetchPositions]);

  function handleDeposit() {
    if (!depositAmount || parseFloat(depositAmount) < 1) return;
    doDeposit({
      address: VAULT_ADDRESS,
      abi: PATRON_VAULT_ABI,
      functionName: "deposit",
      args: [selectedTier],
      value: parseEther(depositAmount),
    });
  }

  // ── Withdraw ──
  const { writeContract: doWithdraw, data: withdrawHash, isPending: isWithdrawPending } = useWriteContract();
  const { isSuccess: withdrawConfirmed } = useWaitForTransactionReceipt({ hash: withdrawHash });

  useEffect(() => {
    if (withdrawConfirmed) {
      setWithdrawingId(null);
      refetchPositions();
    }
  }, [withdrawConfirmed, refetchPositions]);

  function handleWithdraw(positionId: bigint, emergency: boolean) {
    setWithdrawingId(positionId);
    doWithdraw({
      address: VAULT_ADDRESS,
      abi: PATRON_VAULT_ABI,
      functionName: emergency ? "emergencyWithdraw" : "withdraw",
      args: [positionId],
    });
  }

  const positionIds = (userPositionIds as bigint[]) || [];

  return (
    <div className="min-h-screen py-20 px-6">
      <div className="max-w-5xl mx-auto space-y-12">

        {/* ═══ Header ═══ */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-[var(--accent-gold)] animate-pulse-glow" />
            <span className="text-[0.65rem] font-mono text-[var(--accent-gold)] tracking-[0.3em] font-bold">
              PATRON VAULT
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">
            Capital Lock Interface
          </h1>
          <p className="text-sm text-[var(--text-secondary)] max-w-2xl leading-relaxed">
            Deposit POL into the PatronVault. Choose a lock tier. Earn $CORE rewards proportional
            to your commitment. Longer locks unlock higher multipliers. Early exit incurs 10% penalty.
          </p>
          <a
            href={`${POLYGONSCAN_BASE}/address/${CONTRACTS.PATRON_VAULT}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-[0.65rem] font-mono text-[var(--text-muted)] hover:text-[var(--accent-blue)] transition-colors"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-green)]" />
            POLYGON MAINNET — {CONTRACTS.PATRON_VAULT.slice(0, 6)}...{CONTRACTS.PATRON_VAULT.slice(-4)}
          </a>
        </div>

        {/* ═══ Protocol Stats ═══ */}
        <div className="grid grid-cols-3 gap-4">
          {[
            {
              label: "TOTAL DEPOSITED",
              value: totalDeposited ? `${parseFloat(formatEther(totalDeposited as bigint)).toFixed(2)} POL` : "—",
              color: "var(--accent-blue)",
            },
            {
              label: "TOTAL POSITIONS",
              value: totalPositions ? (totalPositions as bigint).toString() : "—",
              color: "var(--accent-gold)",
            },
            {
              label: "$CORE DISTRIBUTED",
              value: totalCoreDistributed ? `${parseFloat(formatEther(totalCoreDistributed as bigint)).toFixed(2)}` : "—",
              color: "var(--accent-green)",
            },
          ].map((stat) => (
            <div key={stat.label} className="glass-panel p-4 text-center">
              <div className="text-[0.6rem] font-mono text-[var(--text-muted)] tracking-wider mb-2">
                {stat.label}
              </div>
              <div className="text-lg font-mono font-bold" style={{ color: stat.color }}>
                {stat.value}
              </div>
            </div>
          ))}
        </div>

        {/* ═══ Deposit Interface ═══ */}
        <div className="glass-panel p-6 space-y-6">
          <div className="flex items-center gap-3">
            <span className="text-[0.65rem] font-mono text-[var(--text-muted)] tracking-[0.2em] font-bold">
              OPEN POSITION
            </span>
          </div>

          {/* Tier Selection */}
          <div className="grid grid-cols-4 gap-3">
            {TIERS.map((tier) => (
              <button
                key={tier.index}
                onClick={() => setSelectedTier(tier.index)}
                className="p-4 rounded-lg border transition-all cursor-pointer text-left space-y-2"
                style={{
                  background: selectedTier === tier.index ? tier.hoverBg : tier.bgAlpha,
                  borderColor: selectedTier === tier.index ? tier.color : tier.borderAlpha,
                  boxShadow: selectedTier === tier.index ? `0 0 20px ${tier.bgAlpha}` : "none",
                }}
              >
                <div className="text-[0.65rem] font-mono font-bold tracking-widest" style={{ color: tier.color }}>
                  {tier.label}
                </div>
                <div className="text-[0.6rem] font-mono text-[var(--text-secondary)]">{tier.duration}</div>
                <div className="text-lg font-mono font-bold text-[var(--text-primary)]">{tier.multiplier}</div>
                <div className="text-[0.55rem] font-mono text-[var(--text-muted)]">REWARD MULTIPLIER</div>
              </button>
            ))}
          </div>

          {/* Amount + Deposit */}
          {isConnected ? (
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <input
                  type="number"
                  min="1"
                  step="0.1"
                  placeholder="Amount (min 1 POL)"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="w-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded px-4 py-3 text-sm font-mono text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-blue)] transition-colors"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[0.65rem] font-mono text-[var(--text-muted)]">
                  POL
                </span>
              </div>
              <button
                onClick={handleDeposit}
                disabled={isDepositing || !depositAmount || parseFloat(depositAmount || "0") < 1}
                className="px-8 py-3 text-[0.7rem] font-mono font-bold tracking-widest rounded transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  background: TIERS[selectedTier].color,
                  color: "#0B0F1A",
                  boxShadow: `0 0 20px ${TIERS[selectedTier].bgAlpha}`,
                }}
              >
                {isDepositing ? "CONFIRMING..." : depositConfirmed ? "DEPOSITED ✓" : "DEPOSIT"}
              </button>
            </div>
          ) : (
            <div className="text-center py-6 glass-panel rounded-lg">
              <p className="text-sm font-mono text-[var(--text-secondary)]">
                Connect your wallet to deposit into the PatronVault
              </p>
            </div>
          )}
        </div>

        {/* ═══ Your Positions ═══ */}
        {isConnected && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[0.65rem] font-mono text-[var(--text-muted)] tracking-[0.2em] font-bold">
                YOUR POSITIONS
              </span>
              <span className="text-[0.6rem] font-mono text-[var(--text-secondary)]">
                {positionIds.length} POSITION{positionIds.length !== 1 ? "S" : ""}
              </span>
            </div>

            {positionIds.length === 0 ? (
              <div className="glass-panel p-8 text-center">
                <p className="text-sm font-mono text-[var(--text-muted)]">
                  No active positions. Deposit POL above to open your first vault position.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {positionIds.map((id) => (
                  <PositionCard
                    key={id.toString()}
                    positionId={id}
                    onWithdraw={handleWithdraw}
                    withdrawingId={withdrawingId}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══ Tier Details ═══ */}
        <div className="space-y-4">
          <span className="text-[0.65rem] font-mono text-[var(--text-muted)] tracking-[0.2em] font-bold">
            TIER MECHANICS
          </span>
          <div className="glass-panel overflow-hidden">
            <table className="w-full text-sm font-mono">
              <thead>
                <tr className="border-b border-[var(--border-subtle)]">
                  <th className="text-left px-4 py-3 text-[0.6rem] tracking-wider text-[var(--text-muted)] font-normal">TIER</th>
                  <th className="text-left px-4 py-3 text-[0.6rem] tracking-wider text-[var(--text-muted)] font-normal">LOCK PERIOD</th>
                  <th className="text-left px-4 py-3 text-[0.6rem] tracking-wider text-[var(--text-muted)] font-normal">MULTIPLIER</th>
                  <th className="text-left px-4 py-3 text-[0.6rem] tracking-wider text-[var(--text-muted)] font-normal">MIN DEPOSIT</th>
                  <th className="text-left px-4 py-3 text-[0.6rem] tracking-wider text-[var(--text-muted)] font-normal">EARLY EXIT</th>
                </tr>
              </thead>
              <tbody>
                {TIERS.map((tier) => (
                  <tr key={tier.index} className="border-b border-[var(--border-subtle)] last:border-b-0 hover:bg-[var(--bg-panel-hover)] transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-bold tracking-wider" style={{ color: tier.color }}>{tier.label}</span>
                    </td>
                    <td className="px-4 py-3 text-[var(--text-secondary)]">{tier.duration}</td>
                    <td className="px-4 py-3 text-[var(--text-primary)] font-bold">{tier.multiplier}</td>
                    <td className="px-4 py-3 text-[var(--text-secondary)]">1 POL</td>
                    <td className="px-4 py-3 text-[var(--accent-crimson)]">−10% $CORE</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ═══ Contract Info ═══ */}
        <div className="glass-panel p-4">
          <div className="flex items-center justify-between text-[0.6rem] font-mono text-[var(--text-muted)]">
            <span>PATRONVAULT CONTRACT</span>
            <a
              href={`${POLYGONSCAN_BASE}/address/${CONTRACTS.PATRON_VAULT}#code`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[var(--accent-blue)] transition-colors"
            >
              {CONTRACTS.PATRON_VAULT} — VERIFIED ✓
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
