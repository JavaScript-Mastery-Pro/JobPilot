import { Activity, ChevronLeft, ChevronRight, Filter } from "lucide-react";
import Link from "next/link";

import { AgentControls } from "@/components/dashboard/AgentControls";
import { JobsInventoryTable } from "@/components/jobs/JobsInventoryTable";
import { getAccessToken, requireCurrentUser } from "@/lib/auth";
import { createInsforgeServer } from "@/lib/insforge-server";
import { cn } from "@/lib/utils";
import type {
  DashboardActiveRun,
  JobInventoryApplyType,
  JobInventoryDisplayStatus,
  JobInventoryItem,
  JobInventoryStatus,
  JobsWorkspaceRun,
} from "@/types";

type JobsPageProps = {
  searchParams: Promise<{
    status?: string | string[];
    sort?: string | string[];
    page?: string | string[];
  }>;
};

type JobsLoadResult =
  | {
      success: true;
      activeRun: DashboardActiveRun | null;
      runContext: JobsWorkspaceRun | null;
      defaultJobTitle: string;
      defaultLocation: string;
      jobs: JobInventoryItem[];
      totalJobs: number;
      totalPages: number;
      currentPage: number;
      statusFilter: JobsStatusFilter;
      sortMode: JobsSortMode;
    }
  | {
      success: false;
      error: string;
    };

type ProfileRow = {
  job_title?: unknown;
  location?: unknown;
};

type AgentRunRow = {
  id?: unknown;
  status?: unknown;
  job_title_searched?: unknown;
  location_searched?: unknown;
  jobs_found?: unknown;
  jobs_matched?: unknown;
  jobs_applied?: unknown;
  jobs_failed?: unknown;
  started_at?: unknown;
  completed_at?: unknown;
  browserbase_session_id?: unknown;
  browserbase_recording_url?: unknown;
};

type JobRow = {
  id?: unknown;
  title?: unknown;
  company?: unknown;
  location?: unknown;
  status?: unknown;
  match_score?: unknown;
  match_reason?: unknown;
  found_at?: unknown;
  applied_at?: unknown;
  cover_letter?: unknown;
  linkedin_url?: unknown;
  external_apply_url?: unknown;
  error_message?: unknown;
  is_tailored?: unknown;
};

type JobsStatusFilter = "all" | JobInventoryDisplayStatus;

type JobsSortMode = "newest" | "oldest" | "match-desc" | "match-asc";

const JOBS_PER_PAGE = 12;
const STATUS_FILTERS: { value: JobsStatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "applied", label: "Applied" },
  { value: "not_applied", label: "Not applied" },
];
const SORT_MODES: { value: JobsSortMode; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "match-desc", label: "Best match" },
  { value: "match-asc", label: "Weakest match" },
];
const ACTIVE_RUN_STATUSES = ["running", "finding", "applying"];

function getStringValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function getNumberValue(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function getBooleanValue(value: unknown): boolean {
  return typeof value === "boolean" ? value : false;
}

function getSearchParamValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

function isProfileRow(value: unknown): value is ProfileRow {
  return value !== null && typeof value === "object";
}

function isAgentRunRow(value: unknown): value is AgentRunRow {
  return value !== null && typeof value === "object";
}

function isJobRow(value: unknown): value is JobRow {
  return value !== null && typeof value === "object";
}

function isJobInventoryDisplayStatus(
  value: string,
): value is JobInventoryDisplayStatus {
  return STATUS_FILTERS.some(
    (filter: { value: JobsStatusFilter; label: string }) =>
      filter.value === value && filter.value !== "all",
  );
}

function getStatusFilter(value: string): JobsStatusFilter {
  if (isJobInventoryDisplayStatus(value)) {
    return value;
  }

  return "all";
}

function isJobInventoryStatus(value: string): value is JobInventoryStatus {
  return (
    value === "found" ||
    value === "queued" ||
    value === "applying" ||
    value === "needs_input" ||
    value === "applied" ||
    value === "failed" ||
    value === "dismissed"
  );
}

function getDisplayStatus(
  status: JobInventoryStatus,
): JobInventoryDisplayStatus {
  return status === "applied" ? "applied" : "not_applied";
}

function getApplyType(row: JobRow): JobInventoryApplyType {
  if (getStringValue(row.external_apply_url)) {
    return "external_link_apply";
  }

  return getStringValue(row.linkedin_url) ? "easy_apply" : "unknown";
}

function getSortMode(value: string): JobsSortMode {
  if (value === "oldest" || value === "match-desc" || value === "match-asc") {
    return value;
  }

  return "newest";
}

function getCurrentPage(value: string): number {
  const parsedPage = Number.parseInt(value, 10);

  if (!Number.isFinite(parsedPage) || parsedPage < 1) {
    return 1;
  }

  return parsedPage;
}

function normalizeJob(row: JobRow): JobInventoryItem | null {
  const id = getStringValue(row.id);
  const status = getStringValue(row.status);

  if (!id || !isJobInventoryStatus(status)) {
    return null;
  }

  return {
    id,
    title: getStringValue(row.title) || "Untitled role",
    company: getStringValue(row.company) || "Unknown company",
    location: getStringValue(row.location),
    status,
    displayStatus: getDisplayStatus(status),
    applyType: getApplyType(row),
    matchScore: getNumberValue(row.match_score),
    matchReason: getStringValue(row.match_reason),
    foundAt: getStringValue(row.found_at),
    appliedAt: getStringValue(row.applied_at),
    sourceUrl: getStringValue(row.linkedin_url),
    coverLetter: getStringValue(row.cover_letter),
    externalApplyUrl: getStringValue(row.external_apply_url),
    errorMessage: getStringValue(row.error_message),
    isTailored: getBooleanValue(row.is_tailored),
  };
}

function sortJobs(jobs: JobInventoryItem[], sortMode: JobsSortMode) {
  return [...jobs].sort((firstJob, secondJob) => {
    if (sortMode === "oldest") {
      return firstJob.foundAt.localeCompare(secondJob.foundAt);
    }

    if (sortMode === "match-desc") {
      return secondJob.matchScore - firstJob.matchScore;
    }

    if (sortMode === "match-asc") {
      return firstJob.matchScore - secondJob.matchScore;
    }

    return secondJob.foundAt.localeCompare(firstJob.foundAt);
  });
}

function normalizeRunContext(data: unknown): JobsWorkspaceRun | null {
  if (!Array.isArray(data)) {
    return null;
  }

  const row = data
    .filter(isAgentRunRow)
    .filter((runRow: AgentRunRow) => getStringValue(runRow.id))
    .sort((firstRun, secondRun) =>
      getStringValue(secondRun.started_at).localeCompare(
        getStringValue(firstRun.started_at),
      ),
    )[0];

  if (!row) {
    return null;
  }

  const status = getStringValue(row.status);

  return {
    id: getStringValue(row.id),
    status,
    jobTitle: getStringValue(row.job_title_searched),
    location: getStringValue(row.location_searched),
    startedAt: getStringValue(row.started_at),
    completedAt: getStringValue(row.completed_at),
    jobsFound: getNumberValue(row.jobs_found),
    jobsMatched: getNumberValue(row.jobs_matched),
    jobsApplied: getNumberValue(row.jobs_applied),
    jobsFailed: getNumberValue(row.jobs_failed),
    isActive: ACTIVE_RUN_STATUSES.includes(status),
  };
}

function normalizeActiveRun(data: unknown): DashboardActiveRun | null {
  const run = normalizeRunContext(data);

  if (!run || !run.isActive) {
    return null;
  }

  if (!Array.isArray(data)) {
    return null;
  }

  const row = data.filter(isAgentRunRow).find((runRow: AgentRunRow) => {
    return getStringValue(runRow.id) === run.id;
  });

  return {
    id: run.id,
    status: run.status,
    jobTitle: run.jobTitle,
    location: run.location,
    startedAt: run.startedAt,
    browserbaseSessionId: row ? getStringValue(row.browserbase_session_id) : "",
    browserbaseRecordingUrl: row
      ? getStringValue(row.browserbase_recording_url)
      : "",
  };
}

function getPaginationHref(
  statusFilter: JobsStatusFilter,
  sortMode: JobsSortMode,
  page: number,
): string {
  const params = new URLSearchParams();

  if (statusFilter !== "all") {
    params.set("status", statusFilter);
  }

  if (sortMode !== "newest") {
    params.set("sort", sortMode);
  }

  if (page > 1) {
    params.set("page", String(page));
  }

  const queryString = params.toString();

  return queryString ? `/jobs?${queryString}` : "/jobs";
}

async function loadJobsWorkspace(
  statusFilter: JobsStatusFilter,
  sortMode: JobsSortMode,
  requestedPage: number,
): Promise<JobsLoadResult> {
  const user = await requireCurrentUser();
  const accessToken = await getAccessToken();

  if (!accessToken) {
    return {
      success: false,
      error: "Your session expired. Sign in again to load your jobs.",
    };
  }

  const insforge = createInsforgeServer(accessToken);
  const profileResult = await insforge.database
    .from("profiles")
    .select("job_title,location")
    .eq("id", user.id);

  if (profileResult.error) {
    console.error("[jobs/loadJobsWorkspace/profile]", profileResult.error);
    return {
      success: false,
      error: "Could not load your profile defaults. Try refreshing the page.",
    };
  }

  const runsResult = await insforge.database
    .from("agent_runs")
    .select(
      "id,status,job_title_searched,location_searched,jobs_found,jobs_matched,jobs_applied,jobs_failed,started_at,completed_at,browserbase_session_id,browserbase_recording_url",
    )
    .eq("user_id", user.id);

  if (runsResult.error) {
    console.error("[jobs/loadJobsWorkspace/runs]", runsResult.error);
    return {
      success: false,
      error: "Could not load current agent activity. Try refreshing the page.",
    };
  }

  const jobsResult = await insforge.database
    .from("jobs")
    .select(
      "id,title,company,location,status,match_score,match_reason,found_at,applied_at,cover_letter,linkedin_url,external_apply_url,error_message,is_tailored",
    )
    .eq("user_id", user.id);

  if (jobsResult.error) {
    console.error("[jobs/loadJobsWorkspace/jobs]", jobsResult.error);
    return {
      success: false,
      error: "Could not load your job inventory. Try refreshing the page.",
    };
  }

  const profileRow = Array.isArray(profileResult.data)
    ? profileResult.data.find(isProfileRow)
    : null;
  const allJobs = Array.isArray(jobsResult.data)
    ? jobsResult.data
        .filter(isJobRow)
        .map(normalizeJob)
        .filter((job: JobInventoryItem | null): job is JobInventoryItem => {
          return job !== null;
        })
    : [];
  const filteredJobs =
    statusFilter === "all"
      ? allJobs
      : allJobs.filter(
          (job: JobInventoryItem) => job.displayStatus === statusFilter,
        );
  const sortedJobs = sortJobs(filteredJobs, sortMode);
  const totalPages = Math.max(1, Math.ceil(sortedJobs.length / JOBS_PER_PAGE));
  const currentPage = Math.min(requestedPage, totalPages);
  const startIndex = (currentPage - 1) * JOBS_PER_PAGE;

  return {
    success: true,
    activeRun: normalizeActiveRun(runsResult.data),
    runContext: normalizeRunContext(runsResult.data),
    defaultJobTitle: profileRow ? getStringValue(profileRow.job_title) : "",
    defaultLocation: profileRow ? getStringValue(profileRow.location) : "",
    jobs: sortedJobs.slice(startIndex, startIndex + JOBS_PER_PAGE),
    totalJobs: sortedJobs.length,
    totalPages,
    currentPage,
    statusFilter,
    sortMode,
  };
}

function JobsLoadError({ message }: { message: string }) {
  return (
    <section className="rounded-2xl border border-default bg-surface">
      <div className="border-b border-default px-5 py-4">
        <p className="text-sm text-accent-text">Jobs</p>
        <h1 className="mt-1 text-3xl font-semibold text-text-primary">
          Workspace
        </h1>
      </div>
      <div className="p-5">
        <div className="rounded-2xl border border-state-error/20 bg-state-error-dim p-4">
          <p className="text-sm font-medium text-state-error">{message}</p>
        </div>
      </div>
    </section>
  );
}

function JobsRunContext({ run }: { run: JobsWorkspaceRun | null }) {
  return (
    <section className="rounded-2xl border border-default bg-surface">
      <div className="flex flex-col gap-3 border-b border-default px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-accent-text">Live context</p>
          <h2 className="mt-1 text-xl font-semibold text-text-primary">
            Current run
          </h2>
        </div>
        <span
          className={cn(
            "inline-flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
            run?.isActive
              ? "border-state-warning/20 bg-state-warning-dim text-state-warning"
              : "border-state-neutral/20 bg-state-neutral-dim text-state-neutral",
          )}>
          <Activity className="h-4 w-4" aria-hidden="true" />
          {run?.isActive ? "Active" : "Latest"}
        </span>
      </div>
      <div className="grid gap-4 p-5 md:grid-cols-4">
        <div className="md:col-span-2">
          <p className="text-sm font-medium text-text-primary">
            {run?.jobTitle || "No search yet"}
          </p>
          <p className="mt-1 text-sm text-text-muted">
            {run?.location || "Start a search to populate this workspace."}
          </p>
        </div>
        <div>
          <p className="text-2xl font-bold text-text-primary">
            {run?.jobsFound ?? 0}
          </p>
          <p className="mt-1 text-xs font-medium uppercase tracking-wide text-text-muted">
            Found
          </p>
        </div>
        <div>
          <p className="text-2xl font-bold text-text-primary">
            {run?.jobsApplied ?? 0}
          </p>
          <p className="mt-1 text-xs font-medium uppercase tracking-wide text-text-muted">
            Applied
          </p>
        </div>
      </div>
    </section>
  );
}

function JobsFilters({
  statusFilter,
  sortMode,
}: {
  statusFilter: JobsStatusFilter;
  sortMode: JobsSortMode;
}) {
  return (
    <form
      action="/jobs"
      className="rounded-2xl border border-default bg-surface p-5">
      <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-text-secondary">
            Status
          </span>
          <select
            name="status"
            defaultValue={statusFilter}
            className="h-10 rounded-xl border border-default bg-subtle px-3 text-sm text-text-primary outline-none transition-colors focus:border-accent-border focus:ring-1 focus:ring-accent-border">
            {STATUS_FILTERS.map(
              (filter: { value: JobsStatusFilter; label: string }) => (
                <option key={filter.value} value={filter.value}>
                  {filter.label}
                </option>
              ),
            )}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-text-secondary">Sort</span>
          <select
            name="sort"
            defaultValue={sortMode}
            className="h-10 rounded-xl border border-default bg-subtle px-3 text-sm text-text-primary outline-none transition-colors focus:border-accent-border focus:ring-1 focus:ring-accent-border">
            {SORT_MODES.map((mode: { value: JobsSortMode; label: string }) => (
              <option key={mode.value} value={mode.value}>
                {mode.label}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-accent-primary px-4 text-sm font-medium text-bg-base transition-colors hover:bg-accent-hover hover:shadow-accent">
          <Filter className="h-4 w-4" aria-hidden="true" />
          Apply
        </button>
      </div>
    </form>
  );
}

function JobsPagination({
  currentPage,
  totalPages,
  statusFilter,
  sortMode,
}: {
  currentPage: number;
  totalPages: number;
  statusFilter: JobsStatusFilter;
  sortMode: JobsSortMode;
}) {
  if (totalPages <= 1) {
    return null;
  }

  const previousPage = Math.max(1, currentPage - 1);
  const nextPage = Math.min(totalPages, currentPage + 1);

  return (
    <nav className="flex items-center justify-between">
      <Link
        href={getPaginationHref(statusFilter, sortMode, previousPage)}
        aria-disabled={currentPage === 1}
        className={cn(
          "inline-flex h-9 items-center gap-2 rounded-xl border border-default bg-elevated px-4 text-sm font-medium text-text-secondary transition-colors hover:border-subtle hover:bg-subtle hover:text-text-primary",
          currentPage === 1 ? "pointer-events-none opacity-50" : "",
        )}>
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        Previous
      </Link>
      <p className="text-sm text-text-muted">
        Page {currentPage} of {totalPages}
      </p>
      <Link
        href={getPaginationHref(statusFilter, sortMode, nextPage)}
        aria-disabled={currentPage === totalPages}
        className={cn(
          "inline-flex h-9 items-center gap-2 rounded-xl border border-default bg-elevated px-4 text-sm font-medium text-text-secondary transition-colors hover:border-subtle hover:bg-subtle hover:text-text-primary",
          currentPage === totalPages ? "pointer-events-none opacity-50" : "",
        )}>
        Next
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </nav>
  );
}

export default async function JobsPage({ searchParams }: JobsPageProps) {
  const resolvedSearchParams = await searchParams;
  const statusFilter = getStatusFilter(
    getSearchParamValue(resolvedSearchParams.status),
  );
  const sortMode = getSortMode(getSearchParamValue(resolvedSearchParams.sort));
  const currentPage = getCurrentPage(
    getSearchParamValue(resolvedSearchParams.page),
  );
  const jobsResult = await loadJobsWorkspace(
    statusFilter,
    sortMode,
    currentPage,
  );

  if (!jobsResult.success) {
    return <JobsLoadError message={jobsResult.error} />;
  }

  return (
    <section className="grid min-w-0 gap-6 overflow-hidden">
      <div>
        <p className="text-sm text-accent-text">Jobs</p>
        <h1 className="mt-1 text-3xl font-semibold text-text-primary">
          Workspace
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-text-muted">
          Run job searches, review below-threshold matches, and track
          application outcomes from one operational surface.
        </p>
      </div>

      <AgentControls
        activeRun={jobsResult.activeRun}
        defaultJobTitle={jobsResult.defaultJobTitle}
        defaultLocation={jobsResult.defaultLocation}
      />
      {/* <JobsRunContext run={jobsResult.runContext} /> */}
      <JobsFilters
        statusFilter={jobsResult.statusFilter}
        sortMode={jobsResult.sortMode}
      />
      <JobsInventoryTable
        jobs={jobsResult.jobs}
        totalJobs={jobsResult.totalJobs}
      />
      <JobsPagination
        currentPage={jobsResult.currentPage}
        totalPages={jobsResult.totalPages}
        statusFilter={jobsResult.statusFilter}
        sortMode={jobsResult.sortMode}
      />
    </section>
  );
}
