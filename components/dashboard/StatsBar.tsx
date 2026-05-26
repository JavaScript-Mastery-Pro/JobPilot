import {
  CircleCheck,
  Gauge,
  MousePointerClick,
  SearchCheck,
  Send,
} from "lucide-react";

import type { DashboardStats } from "@/types";

type StatsBarProps = {
  stats: DashboardStats;
};

type StatCard = {
  label: string;
  value: string;
  caption: string;
  icon: typeof SearchCheck;
};

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatRate(value: number): string {
  return `${value}%`;
}

export function StatsBar({ stats }: StatsBarProps) {
  const statCards: StatCard[] = [
    {
      label: "Total found",
      value: formatNumber(stats.totalFound),
      caption: "Public roles discovered",
      icon: SearchCheck,
    },
    {
      label: "Auto applied",
      value: formatNumber(stats.autoApplied),
      caption: "Submitted by the agent",
      icon: Send,
    },
    {
      label: "Manually applied",
      value: formatNumber(stats.manuallyApplied),
      caption: "Tailored review jobs",
      icon: MousePointerClick,
    },
    {
      label: "Match rate",
      value: formatRate(stats.matchRate),
      caption: "Matches from found jobs",
      icon: Gauge,
    },
    {
      label: "Success rate",
      value: formatRate(stats.successRate),
      caption: "Successful submissions",
      icon: CircleCheck,
    },
  ];

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {statCards.map((card: StatCard) => {
        const Icon = card.icon;

        return (
          <article
            key={card.label}
            className="rounded-2xl border border-default bg-elevated p-5"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-2xl font-bold text-text-primary">
                  {card.value}
                </p>
                <p className="mt-1 text-xs font-medium uppercase tracking-wide text-text-muted">
                  {card.label}
                </p>
              </div>
              <span className="rounded-xl border border-accent-border bg-accent-dim p-2 text-accent-text">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
            </div>
            <p className="mt-4 text-sm text-text-secondary">{card.caption}</p>
          </article>
        );
      })}
    </section>
  );
}
