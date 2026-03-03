"use client";

import { formatNumber } from "@/lib/data";

interface StatItem {
  label: string;
  value: string | number;
  prefix?: string;
}

export default function LiveStats({ stats }: { stats: StatItem[] }) {
  return (
    <div className="live-ticker flex flex-wrap items-center justify-center gap-6 py-3 px-4">
      {stats.map((stat, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="text-[var(--text-muted)] text-[0.65rem] tracking-wider uppercase">
            {stat.label}
          </span>
          <span className="value text-[0.8rem]">
            {stat.prefix || ""}
            {typeof stat.value === "number" ? formatNumber(stat.value) : stat.value}
          </span>
          {i < stats.length - 1 && (
            <span className="text-[var(--text-muted)] ml-4">│</span>
          )}
        </div>
      ))}
    </div>
  );
}
