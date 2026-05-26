import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  Link2,
  MapPin,
  XCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { MatchBreakdown } from "@/components/jobs/MatchBreakdown";
import { TailorAndApply } from "@/components/jobs/TailorAndApply";
import { MATCH_THRESHOLD } from "@/lib/utils";
import type { JobDetails as JobDetailsType } from "@/types";

type JobDetailsProps = {
  job: JobDetailsType;
};

type StatusConfig = {
  label: string;
  className: string;
  Icon: LucideIcon;
};

const STATUS_CONFIG: Record<string, StatusConfig> = {
  applied: {
    label: "Applied",
    className:
      "border-state-success/20 bg-state-success-dim text-state-success",
    Icon: CheckCircle2,
  },
  applying: {
    label: "Applying…",
    className:
      "border-state-warning/20 bg-state-warning-dim text-state-warning",
    Icon: Clock,
  },
  queued: {
    label: "Queued",
    className: "border-state-info/20 bg-state-info-dim text-state-info",
    Icon: Clock,
  },
  needs_input: {
    label: "Needs Input",
    className:
      "border-state-warning/20 bg-state-warning-dim text-state-warning",
    Icon: Clock,
  },
  failed: {
    label: "Failed",
    className: "border-state-error/20 bg-state-error-dim text-state-error",
    Icon: XCircle,
  },
  dismissed: {
    label: "Dismissed",
    className:
      "border-state-neutral/20 bg-state-neutral-dim text-state-neutral",
    Icon: XCircle,
  },
  found: {
    label: "Found",
    className:
      "border-state-neutral/20 bg-state-neutral-dim text-state-neutral",
    Icon: Clock,
  },
};

function getCompanyInitials(company: string): string {
  return company
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase();
}

function formatDate(dateString: string): string {
  if (!dateString) return "—";
  try {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateString;
  }
}

function getApplyType(
  job: JobDetailsType,
): "External" | "Easy Apply" | "Unknown" {
  if (job.isEasyApply) return "Easy Apply";
  if (job.externalApplyUrl) return "External";
  return "Unknown";
}

function CompanyAvatar({ company }: { company: string }) {
  return (
    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-default bg-elevated text-base font-bold text-text-secondary select-none">
      {getCompanyInitials(company)}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.found;
  const { Icon, label, className } = config;

  return (
    <Badge
      variant="outline"
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${className}`}>
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {label}
    </Badge>
  );
}

function ApplyTypeBadge({ job }: { job: JobDetailsType }) {
  const applyType = getApplyType(job);

  if (applyType === "Unknown") return null;

  const className =
    applyType === "External"
      ? "border-accent-border bg-accent-dim text-accent-text"
      : "border-state-neutral/20 bg-state-neutral-dim text-state-neutral";

  return (
    <Badge
      variant="outline"
      className={`rounded-full px-2.5 py-1 text-xs font-medium ${className}`}>
      {applyType}
    </Badge>
  );
}

function MatchScoreCard({ score }: { score: number }) {
  const isStrong = score >= MATCH_THRESHOLD;
  const isMid = score >= 50;
  const colorClass = isStrong
    ? "text-state-success"
    : isMid
      ? "text-state-warning"
      : "text-state-error";
  const fillClass = isStrong
    ? "bg-state-success"
    : isMid
      ? "bg-state-warning"
      : "bg-state-error";
  const label = isStrong ? "Strong match" : isMid ? "Needs review" : "Weak fit";
  const widthStyle = { width: `${score}%` };

  return (
    <div className="flex shrink-0 flex-col items-center justify-center gap-3 rounded-2xl border border-default bg-elevated px-8 py-5">
      <div
        className={`text-4xl font-bold tabular-nums leading-none ${colorClass}`}>
        {score}
        <span className="text-2xl">%</span>
      </div>
      <div className="w-full">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-subtle">
          <div
            className={`h-1.5 rounded-full transition-all ${fillClass}`}
            style={widthStyle}
          />
        </div>
      </div>
      <p className="text-xs font-medium text-text-muted">{label}</p>
    </div>
  );
}

function CoverLetterSection({ coverLetter }: { coverLetter: string }) {
  if (!coverLetter.trim()) return null;

  return (
    <section>
      <div className="flex items-end justify-between gap-4 border-b border-default pb-3">
        <div>
          {/* <p className="text-sm text-accent-text">Generated by GPT-4o</p> */}
          <h2 className="mt-1 text-xl font-semibold text-text-primary">
            Cover letter
          </h2>
        </div>
      </div>
      <div className="mt-4 whitespace-pre-wrap rounded-xl border border-default bg-surface p-5 text-sm leading-7 text-text-secondary">
        {coverLetter.trim()}
      </div>
    </section>
  );
}

type TimelineEntryProps = {
  Icon: LucideIcon;
  label: string;
  value: string;
  iconClass?: string;
};

function TimelineEntry({
  Icon,
  label,
  value,
  iconClass = "text-text-faint",
}: TimelineEntryProps) {
  return (
    <div className="flex items-start gap-3">
      <span className={`mt-0.5 shrink-0 ${iconClass}`}>
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium text-text-muted">{label}</p>
        <p className="mt-0.5 text-sm text-text-secondary">{value}</p>
      </div>
    </div>
  );
}

export function JobDetails({ job }: JobDetailsProps) {
  const description = job.description.trim()
    ? job.description.trim()
    : "The agent did not capture a full description for this posting. Open the company apply page to review the original job before tailoring your resume.";

  const hasTailoredResume = job.isTailored && Boolean(job.resumeUrl);
  const downloadUrl = hasTailoredResume
    ? `/api/resume/jobs/${job.id}/download`
    : "/api/resume/download";

  return (
    <div className="mx-auto grid max-w-6xl gap-8">
      {/* Back nav */}
      <div>
        <Link
          href="/jobs"
          className="inline-flex h-8 items-center gap-1.5 rounded-xl px-3 text-sm font-medium text-text-muted transition-colors hover:bg-subtle hover:text-text-secondary">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to jobs
        </Link>
      </div>

      {/* Header card */}
      <header className="rounded-2xl border border-default bg-surface p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 gap-4">
            <CompanyAvatar company={job.company} />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={job.status} />
                <ApplyTypeBadge job={job} />
                {job.location ? (
                  <span className="inline-flex items-center gap-1.5 text-xs text-text-muted">
                    <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                    {job.location}
                  </span>
                ) : null}
              </div>
              <h1 className="mt-3 max-w-2xl text-2xl font-semibold leading-tight text-text-primary sm:text-3xl">
                {job.title}
              </h1>
              <p className="mt-1.5 text-base font-medium text-text-secondary">
                {job.company}
              </p>
            </div>
          </div>
          {/* <MatchScoreCard score={job.matchScore} /> */}
        </div>
      </header>

      {/* Body */}
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
        {/* Main column */}
        <main className="grid content-start gap-8">
          {/* Description */}
          <section>
            <div className="flex items-end justify-between gap-4 border-b border-default pb-3">
              <div>
                <p className="text-sm text-accent-text">Role details</p>
                <h2 className="mt-1 text-xl font-semibold text-text-primary">
                  Job description
                </h2>
              </div>
            </div>
            <div className="mt-4 max-h-[36rem] overflow-y-auto rounded-xl border border-default bg-surface p-5 text-sm leading-7 text-text-secondary scrollbar-thin">
              <div className="whitespace-pre-wrap">{description}</div>
            </div>
          </section>

          <MatchBreakdown score={job.matchScore} reason={job.matchReason} />

          <CoverLetterSection coverLetter={job.coverLetter} />
        </main>

        {/* Sidebar */}
        <aside className="grid content-start gap-5">
          {/* Quick actions */}
          <section className="rounded-xl border border-default bg-surface">
            <div className="border-b border-default px-4 py-3">
              <p className="text-sm font-medium text-text-primary">Actions</p>
            </div>
            <div className="grid gap-2 p-4">
              {job.externalApplyUrl ? (
                <a
                  href={job.externalApplyUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-accent-primary px-4 text-sm font-medium text-bg-base transition-colors hover:bg-accent-hover hover:shadow-accent">
                  <ExternalLink className="h-4 w-4" aria-hidden="true" />
                  Open apply page
                </a>
              ) : (
                <span className="inline-flex h-9 cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-accent-primary/30 px-4 text-sm font-medium text-bg-base/50">
                  <ExternalLink className="h-4 w-4" aria-hidden="true" />
                  No apply page saved
                </span>
              )}
              {job.sourceUrl ? (
                <a
                  href={job.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-default bg-elevated px-4 text-sm font-medium text-text-secondary transition-colors hover:border-subtle hover:bg-subtle hover:text-text-primary">
                  <Link2 className="h-4 w-4" aria-hidden="true" />
                  View source posting
                  <ExternalLink
                    className="h-4 w-4 opacity-60"
                    aria-hidden="true"
                  />
                </a>
              ) : (
                <span className="inline-flex h-9 cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-default/40 bg-elevated/40 px-4 text-sm font-medium text-text-faint">
                  <Link2 className="h-4 w-4" aria-hidden="true" />
                  No source link saved
                </span>
              )}
              {hasTailoredResume || job.hasBaseResume ? (
                <a
                  href={downloadUrl}
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-default bg-elevated px-4 text-sm font-medium text-text-secondary transition-colors hover:border-subtle hover:bg-subtle hover:text-text-primary">
                  <FileText className="h-4 w-4" aria-hidden="true" />
                  {hasTailoredResume
                    ? "Download tailored resume"
                    : "Download resume"}
                </a>
              ) : (
                <Link
                  href="/profile"
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-default bg-elevated px-4 text-sm font-medium text-text-secondary transition-colors hover:border-subtle hover:bg-subtle hover:text-text-primary">
                  <FileText className="h-4 w-4" aria-hidden="true" />
                  Generate resume
                </Link>
              )}
            </div>
          </section>

          {/* Tailor + apply */}
          <TailorAndApply
            jobId={job.id}
            hasBaseResume={job.hasBaseResume}
            isTailored={job.isTailored}
            status={job.status}
            isEasyApply={job.isEasyApply}
            linkedinConnected={job.linkedinConnected}
          />

          {/* Timeline */}
          <section className="rounded-xl border border-default bg-surface p-4">
            <p className="mb-4 text-sm font-medium text-text-primary">
              Timeline
            </p>
            <div className="grid gap-4">
              <TimelineEntry
                Icon={Calendar}
                label="Found"
                value={formatDate(job.foundAt)}
              />
              {job.appliedAt ? (
                <TimelineEntry
                  Icon={CheckCircle2}
                  label="Applied"
                  value={formatDate(job.appliedAt)}
                  iconClass="text-state-success"
                />
              ) : null}
              <TimelineEntry
                Icon={FileText}
                label="Resume"
                value={
                  hasTailoredResume
                    ? "Tailored for this role"
                    : job.hasBaseResume
                      ? "Base resume"
                      : "Not generated"
                }
              />
              <TimelineEntry
                Icon={Clock}
                label="Apply type"
                value={getApplyType(job)}
              />
            </div>
            {job.errorMessage ? (
              <div className="mt-4 rounded-xl border border-state-error/20 bg-state-error-dim p-3">
                <p className="text-xs font-medium uppercase tracking-wide text-state-error">
                  Last error
                </p>
                <p className="mt-1.5 text-sm leading-6 text-state-error">
                  {job.errorMessage}
                </p>
              </div>
            ) : null}
          </section>
        </aside>
      </div>
    </div>
  );
}
