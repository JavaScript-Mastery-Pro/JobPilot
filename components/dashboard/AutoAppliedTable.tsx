"use client";

import { Fragment, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ExternalLink,
  FileText,
  Send,
} from "lucide-react";

import { MATCH_THRESHOLD, cn } from "@/lib/utils";
import type { DashboardAppliedJob } from "@/types";

type AutoAppliedTableProps = {
  jobs: DashboardAppliedJob[];
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

function formatAppliedAt(value: string): string {
  if (!value) {
    return "Not recorded";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not recorded";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function AutoAppliedEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16">
      <Send
        className="h-10 w-10 text-text-faint"
        strokeWidth={1.5}
        aria-hidden="true"
      />
      <h2 className="text-base font-medium text-text-muted">
        No auto-applied jobs yet
      </h2>
      <p className="max-w-xs text-center text-sm leading-6 text-text-faint">
        Completed auto-apply attempts will appear here after the agent submits
        or fails a company application.
      </p>
    </div>
  );
}

function StatusBadge({ job }: { job: DashboardAppliedJob }) {
  if (job.status === "applied") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-state-success/20 bg-state-success-dim px-2.5 py-1 text-xs font-medium text-state-success">
        <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
        Applied
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-state-error/20 bg-state-error-dim px-2.5 py-1 text-xs font-medium text-state-error">
      <AlertCircle className="h-4 w-4" aria-hidden="true" />
      Failed
    </span>
  );
}

function MatchScore({ score }: { score: number }) {
  const scoreClass = getScoreClass(score);
  const scoreFillClass = getScoreFillClass(score);
  const scoreWidthClass = getScoreWidthClass(score);

  return (
    <div className="w-28">
      <div className="flex items-center justify-between gap-3">
        <span className={cn("text-sm font-semibold", scoreClass)}>
          {score}%
        </span>
      </div>
      <div className="mt-2 h-1.5 w-24 rounded-full bg-subtle">
        <div
          className={cn("h-1.5 rounded-full", scoreFillClass, scoreWidthClass)}
        />
      </div>
    </div>
  );
}

export function AutoAppliedTable({ jobs }: AutoAppliedTableProps) {
  const [expandedJobId, setExpandedJobId] = useState<string>("");

  function toggleJob(jobId: string): void {
    setExpandedJobId((currentJobId: string) =>
      currentJobId === jobId ? "" : jobId,
    );
  }

  return (
    <section className="rounded-2xl border border-default bg-surface">
      <div className="border-b border-default px-5 py-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm text-accent-text">Auto-applied jobs</p>
            <h1 className="mt-1 text-3xl font-semibold text-text-primary">
              Application outcomes
            </h1>
          </div>
          <p className="text-sm text-text-muted">
            {jobs.length} {jobs.length === 1 ? "job" : "jobs"}
          </p>
        </div>
      </div>
      <div className="p-5">
        {jobs.length > 0 ? (
          <div className="overflow-hidden rounded-2xl border border-default bg-surface">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[52rem] border-collapse">
                <thead>
                  <tr className="border-b border-default bg-subtle">
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-text-muted">
                      Company
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-text-muted">
                      Title
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-text-muted">
                      Match
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-text-muted">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-text-muted">
                      Applied
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-text-muted">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((job: DashboardAppliedJob) => {
                    const isExpanded = expandedJobId === job.id;

                    return (
                      <Fragment key={job.id}>
                        <tr
                          className="border-b border-default transition-colors last:border-0 hover:bg-elevated"
                        >
                          <td className="px-4 py-3 text-sm font-medium text-text-primary">
                            {job.company}
                          </td>
                          <td className="px-4 py-3 text-sm text-text-secondary">
                            {job.title}
                          </td>
                          <td className="px-4 py-3">
                            <MatchScore score={job.matchScore} />
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge job={job} />
                          </td>
                          <td className="px-4 py-3 text-sm text-text-secondary">
                            {formatAppliedAt(job.appliedAt)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              type="button"
                              onClick={() => toggleJob(job.id)}
                              aria-expanded={isExpanded}
                              className="inline-flex h-8 items-center justify-center gap-1.5 rounded-xl px-3 text-xs font-medium text-text-muted transition-colors hover:bg-subtle hover:text-text-secondary"
                            >
                              <span>{isExpanded ? "Hide" : "Show"}</span>
                              <ChevronDown
                                className={cn(
                                  "h-4 w-4 transition-transform",
                                  isExpanded ? "rotate-180" : "",
                                )}
                                aria-hidden="true"
                              />
                            </button>
                          </td>
                        </tr>
                        {isExpanded ? (
                          <tr className="border-b border-default bg-subtle">
                            <td colSpan={6} className="px-4 py-4">
                              <div className="grid gap-4 lg:grid-cols-[1fr_18rem]">
                                <div className="rounded-xl border border-default bg-elevated p-4">
                                  <div className="flex items-center gap-2 text-sm font-medium text-text-primary">
                                    <FileText
                                      className="h-4 w-4 text-accent-text"
                                      aria-hidden="true"
                                    />
                                    Cover letter
                                  </div>
                                  <p className="mt-3 whitespace-pre-line text-sm leading-6 text-text-secondary">
                                    {job.coverLetter ||
                                      "No cover letter was saved for this application."}
                                  </p>
                                </div>
                                <div className="rounded-xl border border-default bg-elevated p-4">
                                  <p className="text-sm font-medium text-text-primary">
                                    Application link
                                  </p>
                                  {job.externalApplyUrl ? (
                                    <a
                                      href={job.externalApplyUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="mt-3 inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-default bg-elevated px-4 text-sm font-medium text-text-secondary transition-colors hover:border-subtle hover:bg-subtle hover:text-text-primary"
                                    >
                                      <ExternalLink
                                        className="h-4 w-4"
                                        aria-hidden="true"
                                      />
                                      Open company page
                                    </a>
                                  ) : (
                                    <p className="mt-3 text-sm leading-6 text-text-faint">
                                      No external apply URL was saved.
                                    </p>
                                  )}
                                  {job.status === "failed" &&
                                  job.errorMessage ? (
                                    <div className="mt-4 rounded-xl border border-state-error/20 bg-state-error-dim p-3">
                                      <p className="text-xs font-medium uppercase tracking-wide text-state-error">
                                        Failure reason
                                      </p>
                                      <p className="mt-2 text-sm leading-6 text-state-error">
                                        {job.errorMessage}
                                      </p>
                                    </div>
                                  ) : null}
                                </div>
                              </div>
                            </td>
                          </tr>
                        ) : null}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <AutoAppliedEmptyState />
        )}
      </div>
    </section>
  );
}
