"use client";

import { useRouter } from "next/navigation";
import { ExternalLink, SearchCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MATCH_THRESHOLD, cn } from "@/lib/utils";
import type {
  JobInventoryApplyType,
  JobInventoryDisplayStatus,
  JobInventoryItem,
} from "@/types";

type JobsInventoryTableProps = {
  jobs: JobInventoryItem[];
  totalJobs: number;
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

function formatDate(value: string): string {
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

function getStatusConfig(status: JobInventoryDisplayStatus): {
  label: string;
  className: string;
} {
  if (status === "applied") {
    return {
      label: "Applied",
      className:
        "border-state-success/20 bg-state-success-dim text-state-success",
    };
  }

  return {
    label: "Not applied",
    className: "border-state-neutral/20 bg-state-neutral-dim text-state-neutral",
  };
}

function StatusBadge({ status }: { status: JobInventoryDisplayStatus }) {
  const statusConfig = getStatusConfig(status);

  return (
    <Badge
      variant="outline"
      className={cn(
        "h-6 rounded-full px-2.5 font-medium",
        statusConfig.className,
      )}
    >
      {statusConfig.label}
    </Badge>
  );
}

function ApplyTypeBadge({ applyType }: { applyType: JobInventoryApplyType }) {
  const label =
    applyType === "easy_apply"
      ? "Easy Apply"
      : applyType === "external_link_apply"
        ? "External"
        : "Unknown";
  const className =
    applyType === "external_link_apply"
      ? "border-accent-border bg-accent-dim text-accent-text"
      : "border-state-neutral/20 bg-state-neutral-dim text-state-neutral";

  return (
    <Badge
      variant="outline"
      className={cn(
        "h-6 rounded-full px-2.5 font-medium",
        className,
      )}
    >
      {label}
    </Badge>
  );
}

function UrlCell({ href, label }: { href: string; label: string }) {
  if (!href) {
    return <span className="text-xs text-text-faint">Missing</span>;
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      onClick={(event) => event.stopPropagation()}
      aria-label={`Open ${label.toLowerCase()} link`}
      title={label}
      className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-text-muted transition-colors hover:bg-subtle hover:text-text-primary"
    >
      <ExternalLink className="h-4 w-4" aria-hidden="true" />
    </a>
  );
}

function MatchScore({ score }: { score: number }) {
  return (
    <div className="w-20">
      <span className={cn("text-sm font-semibold", getScoreClass(score))}>
        {score}%
      </span>
      <div className="mt-2 h-1.5 w-16 rounded-full bg-subtle">
        <div
          className={cn(
            "h-1.5 rounded-full",
            getScoreFillClass(score),
            getScoreWidthClass(score),
          )}
        />
      </div>
    </div>
  );
}

function JobsInventoryEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16">
      <SearchCheck className="h-10 w-10 text-text-faint" aria-hidden="true" />
      <h2 className="text-base font-medium text-text-muted">
        No jobs match this view
      </h2>
      <p className="max-w-xs text-center text-sm leading-6 text-text-faint">
        Start a search or adjust the filters to review your job inventory.
      </p>
    </div>
  );
}

export function JobsInventoryTable({
  jobs,
  totalJobs,
}: JobsInventoryTableProps) {
  const router = useRouter();

  return (
    <section className="min-w-0 overflow-hidden rounded-2xl border border-default bg-surface">
      <div className="flex flex-col gap-2 border-b border-default px-5 py-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-accent-text">Job inventory</p>
          <h2 className="mt-1 text-xl font-semibold text-text-primary">
            All tracked jobs
          </h2>
        </div>
        <p className="text-sm text-text-muted">
          Showing {jobs.length} of {totalJobs}{" "}
          {totalJobs === 1 ? "job" : "jobs"}
        </p>
      </div>

      <div className="min-w-0 p-5">
        {jobs.length > 0 ? (
          <Table className="min-w-[48rem]">
            <TableHeader>
              <TableRow className="bg-subtle hover:bg-subtle">
                <TableHead className="w-[42%] px-4 text-xs uppercase tracking-wide text-text-muted">
                  Job title
                </TableHead>
                <TableHead className="px-4 text-xs uppercase tracking-wide text-text-muted">
                  Match
                </TableHead>
                <TableHead className="px-4 text-xs uppercase tracking-wide text-text-muted">
                  Type
                </TableHead>
                <TableHead className="px-4 text-xs uppercase tracking-wide text-text-muted">
                  Status
                </TableHead>
                <TableHead className="px-4 text-xs uppercase tracking-wide text-text-muted">
                  Links
                </TableHead>
                <TableHead className="px-4 text-xs uppercase tracking-wide text-text-muted">
                  Date
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.map((job: JobInventoryItem) => (
                <TableRow
                  key={job.id}
                  tabIndex={0}
                  role="link"
                  onClick={() => router.push(`/jobs/${job.id}`)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      router.push(`/jobs/${job.id}`);
                    }
                  }}
                  className="cursor-pointer border-default hover:bg-elevated focus:bg-elevated focus:outline-none"
                >
                  <TableCell className="max-w-[28rem] px-4 py-3 whitespace-normal">
                    <p className="line-clamp-2 text-sm font-medium leading-5 text-text-primary">
                      {job.title}
                    </p>
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <MatchScore score={job.matchScore} />
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <ApplyTypeBadge applyType={job.applyType} />
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <StatusBadge status={job.displayStatus} />
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <UrlCell href={job.sourceUrl} label="Source" />
                      <UrlCell href={job.externalApplyUrl} label="Apply" />
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-sm text-text-secondary">
                    {formatDate(job.appliedAt || job.foundAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <JobsInventoryEmptyState />
        )}
      </div>
    </section>
  );
}
