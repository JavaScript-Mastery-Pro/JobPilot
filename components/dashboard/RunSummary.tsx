import { Activity, CircleCheck, Clock, MapPin, Search } from "lucide-react";

import type { DashboardRunSummary } from "@/types";

type RunSummaryProps = {
  run: DashboardRunSummary | null;
};

function formatDate(value: string): string {
  if (!value) {
    return "Not started";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not started";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function getStatusTone(status: string): {
  label: string;
  className: string;
} {
  if (status === "running" || status === "finding" || status === "applying") {
    return {
      label: "Active",
      className:
        "border-state-warning/20 bg-state-warning-dim text-state-warning",
    };
  }

  if (status === "completed") {
    return {
      label: "Completed",
      className:
        "border-state-success/20 bg-state-success-dim text-state-success",
    };
  }

  if (status === "failed") {
    return {
      label: "Failed",
      className: "border-state-error/20 bg-state-error-dim text-state-error",
    };
  }

  if (status === "stopped") {
    return {
      label: "Stopped",
      className:
        "border-state-neutral/20 bg-state-neutral-dim text-state-neutral",
    };
  }

  return {
    label: "No run",
    className: "border-state-neutral/20 bg-state-neutral-dim text-state-neutral",
  };
}

export function RunSummary({ run }: RunSummaryProps) {
  const statusTone = getStatusTone(run?.status ?? "");

  return (
    <section className="rounded-2xl border border-default bg-surface">
      <div className="flex flex-col gap-3 border-b border-default px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-accent-text">Run summary</p>
          <h2 className="mt-1 text-xl font-semibold text-text-primary">
            Current activity
          </h2>
        </div>
        <span
          className={`inline-flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${statusTone.className}`}
        >
          <Activity className="h-4 w-4" aria-hidden="true" />
          {statusTone.label}
        </span>
      </div>

      {run ? (
        <div className="grid gap-5 p-5 lg:grid-cols-[1.4fr_1fr]">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-default bg-elevated p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-text-primary">
                <Search className="h-4 w-4 text-accent-text" aria-hidden="true" />
                {run.jobTitle || "Untitled search"}
              </div>
              <p className="mt-2 flex items-center gap-2 text-sm text-text-muted">
                <MapPin className="h-4 w-4" aria-hidden="true" />
                {run.location || "Any location"}
              </p>
            </div>
            <div className="rounded-xl border border-default bg-elevated p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-text-primary">
                <Clock className="h-4 w-4 text-accent-text" aria-hidden="true" />
                {formatDate(run.startedAt)}
              </div>
              <p className="mt-2 text-sm text-text-muted">
                {run.completedAt
                  ? `Completed ${formatDate(run.completedAt)}`
                  : "Latest run is still open or waiting on agent work."}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 overflow-hidden rounded-xl border border-default bg-elevated">
            <div className="border-r border-default p-4">
              <p className="text-2xl font-bold text-text-primary">
                {run.jobsFound}
              </p>
              <p className="mt-1 text-xs font-medium uppercase tracking-wide text-text-muted">
                Found
              </p>
            </div>
            <div className="border-r border-default p-4">
              <p className="text-2xl font-bold text-text-primary">
                {run.jobsMatched}
              </p>
              <p className="mt-1 text-xs font-medium uppercase tracking-wide text-text-muted">
                Matched
              </p>
            </div>
            <div className="p-4">
              <p className="text-2xl font-bold text-text-primary">
                {run.jobsApplied}
              </p>
              <p className="mt-1 text-xs font-medium uppercase tracking-wide text-text-muted">
                Applied
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-3 px-5 py-16 text-center">
          <CircleCheck className="h-10 w-10 text-text-faint" aria-hidden="true" />
          <div>
            <h3 className="text-base font-medium text-text-muted">
              No agent runs yet
            </h3>
            <p className="mt-1 max-w-xs text-sm text-text-faint">
              Job discovery and application activity will appear here after the
              first search starts.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
