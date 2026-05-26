import { BriefcaseBusiness, ExternalLink, SearchCheck } from "lucide-react";
import Link from "next/link";

import { DismissReviewJobButton } from "@/components/dashboard/DismissReviewJobButton";
import { MATCH_THRESHOLD, cn } from "@/lib/utils";
import type { ReviewJob } from "@/types";

type ReviewQueueProps = {
  jobs: ReviewJob[];
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

function ReviewQueueEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16">
      <SearchCheck className="h-10 w-10 text-text-faint" aria-hidden="true" />
      <h2 className="text-base font-medium text-text-muted">
        No jobs need review
      </h2>
      <p className="max-w-xs text-center text-sm leading-6 text-text-faint">
        Below-threshold matches will appear here after the agent finishes
        scoring discovered jobs.
      </p>
    </div>
  );
}

function ReviewJobCard({ job }: { job: ReviewJob }) {
  const scoreClass = getScoreClass(job.matchScore);
  const scoreFillClass = getScoreFillClass(job.matchScore);
  const scoreWidthClass = getScoreWidthClass(job.matchScore);

  return (
    <article className="rounded-2xl border border-default bg-elevated p-5 transition-colors hover:border-subtle">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-state-neutral/20 bg-state-neutral-dim px-2.5 py-1 text-xs font-medium text-state-neutral">
              <BriefcaseBusiness className="h-4 w-4" aria-hidden="true" />
              Found
            </span>
            {job.location ? (
              <span className="text-xs text-text-muted">{job.location}</span>
            ) : null}
          </div>

          <h3 className="mt-4 text-base font-medium text-text-primary">
            {job.title}
          </h3>
          <p className="mt-1 text-sm text-text-secondary">{job.company}</p>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-text-secondary">
            {job.matchReason}
          </p>
        </div>

        <div className="flex shrink-0 flex-col gap-4 lg:w-48">
          <div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-medium uppercase tracking-wide text-text-muted">
                Match score
              </span>
              <span className={`text-sm font-semibold ${scoreClass}`}>
                {job.matchScore}%
              </span>
            </div>
            <div className="mt-2 h-1.5 w-full rounded-full bg-subtle">
              <div
                className={cn(
                  "h-1.5 rounded-full",
                  scoreFillClass,
                  scoreWidthClass,
                )}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/jobs/${job.id}`}
              className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-default bg-elevated px-3 text-xs font-medium text-text-secondary transition-colors hover:border-subtle hover:bg-subtle hover:text-text-primary"
            >
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
              Open
            </Link>
            <DismissReviewJobButton jobId={job.id} />
          </div>
        </div>
      </div>
    </article>
  );
}

export function ReviewQueue({ jobs }: ReviewQueueProps) {
  return (
    <section className="rounded-2xl border border-default bg-surface">
      <div className="border-b border-default px-5 py-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm text-accent-text">Review queue</p>
            <h1 className="mt-1 text-3xl font-semibold text-text-primary">
              Jobs needing a closer look
            </h1>
          </div>
          <p className="text-sm text-text-muted">
            {jobs.length} {jobs.length === 1 ? "job" : "jobs"}
          </p>
        </div>
      </div>
      <div className="p-5">
        {jobs.length > 0 ? (
          <div className="grid gap-4">
            {jobs.map((job: ReviewJob) => (
              <ReviewJobCard key={job.id} job={job} />
            ))}
          </div>
        ) : (
          <ReviewQueueEmptyState />
        )}
      </div>
    </section>
  );
}
