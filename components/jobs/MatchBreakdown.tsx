import { Gauge } from "lucide-react";

import { MATCH_THRESHOLD, cn } from "@/lib/utils";

type MatchBreakdownProps = {
  score: number;
  reason: string;
};

function getScoreClass(score: number): string {
  if (score >= MATCH_THRESHOLD) {
    return "text-state-success";
  }

  if (score >= 50) {
    return "text-state-warning";
  }

  return "text-state-error";
}

function getScoreFillClass(score: number): string {
  if (score >= MATCH_THRESHOLD) {
    return "bg-state-success";
  }

  if (score >= 50) {
    return "bg-state-warning";
  }

  return "bg-state-error";
}

function getScoreWidthClass(score: number): string {
  if (score >= 95) {
    return "w-full";
  }

  if (score >= 90) {
    return "w-11/12";
  }

  if (score >= 80) {
    return "w-5/6";
  }

  if (score >= 70) {
    return "w-3/4";
  }

  if (score >= 60) {
    return "w-2/3";
  }

  if (score >= 50) {
    return "w-1/2";
  }

  if (score >= 40) {
    return "w-5/12";
  }

  if (score >= 30) {
    return "w-1/3";
  }

  if (score >= 20) {
    return "w-1/4";
  }

  if (score >= 10) {
    return "w-1/6";
  }

  return "w-1/12";
}

function getMatchLabel(score: number): string {
  if (score >= MATCH_THRESHOLD) {
    return "Strong match";
  }

  if (score >= 50) {
    return "Needs review";
  }

  return "Weak fit";
}

export function MatchBreakdown({
  score,
  reason,
}: MatchBreakdownProps) {
  const scoreClass = getScoreClass(score);
  const scoreFillClass = getScoreFillClass(score);
  const scoreWidthClass = getScoreWidthClass(score);

  return (
    <section className="border-t border-default pt-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-dim text-accent-text">
            <Gauge className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm text-accent-text">Match breakdown</p>
            <h2 className="mt-1 text-xl font-semibold text-text-primary">
              {getMatchLabel(score)}
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-text-secondary">
              {reason}
            </p>
          </div>
        </div>
        <div className="w-full shrink-0 sm:w-56">
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs font-medium uppercase tracking-wide text-text-muted">
              Score
            </span>
            <span className={cn("text-2xl font-semibold", scoreClass)}>
              {score}%
            </span>
          </div>
          <div className="mt-3 h-1.5 w-full rounded-full bg-subtle">
            <div
              className={cn(
                "h-1.5 rounded-full",
                scoreFillClass,
                scoreWidthClass,
              )}
            />
          </div>
          <p className="mt-3 text-xs leading-5 text-text-muted">
            Threshold is {MATCH_THRESHOLD}%.
          </p>
        </div>
      </div>
    </section>
  );
}
