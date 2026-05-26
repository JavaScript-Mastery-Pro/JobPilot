import { AnalyticsPreview } from "@/components/dashboard/AnalyticsPreview";
import { RunSummary } from "@/components/dashboard/RunSummary";
import { StatsBar } from "@/components/dashboard/StatsBar";
import { getAccessToken, requireCurrentUser } from "@/lib/auth";
import { createInsforgeServer } from "@/lib/insforge-server";
import type { DashboardRunSummary, DashboardStats } from "@/types";

type DashboardLoadResult =
  | {
      success: true;
      stats: DashboardStats;
      runSummary: DashboardRunSummary | null;
    }
  | {
      success: false;
      error: string;
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
};

function getStringValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function getNumberValue(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function isAgentRunRow(value: unknown): value is AgentRunRow {
  return value !== null && typeof value === "object";
}

function getSortedRunRows(data: unknown): AgentRunRow[] {
  if (!Array.isArray(data)) {
    return [];
  }

  return data
    .filter(isAgentRunRow)
    .filter((row: AgentRunRow) => getStringValue(row.id))
    .sort((firstRun, secondRun) => {
      return getStringValue(secondRun.started_at).localeCompare(
        getStringValue(firstRun.started_at),
      );
    });
}

function normalizeRunSummary(data: unknown): DashboardRunSummary | null {
  const row = getSortedRunRows(data)[0];

  if (!row) {
    return null;
  }

  const id = getStringValue(row.id);

  if (!id) {
    return null;
  }

  return {
    id,
    status: getStringValue(row.status),
    jobTitle: getStringValue(row.job_title_searched),
    location: getStringValue(row.location_searched),
    startedAt: getStringValue(row.started_at),
    completedAt: getStringValue(row.completed_at),
    jobsFound: getNumberValue(row.jobs_found),
    jobsMatched: getNumberValue(row.jobs_matched),
    jobsApplied: getNumberValue(row.jobs_applied),
    jobsFailed: getNumberValue(row.jobs_failed),
  };
}

function getRate(numerator: number, denominator: number): number {
  if (denominator <= 0) {
    return 0;
  }

  return Math.round((numerator / denominator) * 100);
}

function getDashboardStats(
  data: unknown,
  manuallyApplied: number,
): DashboardStats {
  if (!Array.isArray(data)) {
    return {
      totalFound: 0,
      autoApplied: 0,
      manuallyApplied,
      matchRate: 0,
      successRate: 0,
    };
  }

  const totals = data.filter(isAgentRunRow).reduce(
    (accumulator, row: AgentRunRow) => {
      return {
        totalFound: accumulator.totalFound + getNumberValue(row.jobs_found),
        matched: accumulator.matched + getNumberValue(row.jobs_matched),
        autoApplied:
          accumulator.autoApplied + getNumberValue(row.jobs_applied),
        failed: accumulator.failed + getNumberValue(row.jobs_failed),
      };
    },
    {
      totalFound: 0,
      matched: 0,
      autoApplied: 0,
      failed: 0,
    },
  );
  const totalApplied = totals.autoApplied + manuallyApplied;

  return {
    totalFound: totals.totalFound,
    autoApplied: totals.autoApplied,
    manuallyApplied,
    matchRate: getRate(totals.matched, totals.totalFound),
    successRate: getRate(totalApplied, totalApplied + totals.failed),
  };
}

async function loadDashboard(): Promise<DashboardLoadResult> {
  const user = await requireCurrentUser();
  const accessToken = await getAccessToken();

  if (!accessToken) {
    return {
      success: false,
      error: "Your session expired. Sign in again to load your dashboard.",
    };
  }

  const insforge = createInsforgeServer(accessToken);
  const runsResult = await insforge.database
    .from("agent_runs")
    .select(
      "id,status,job_title_searched,location_searched,jobs_found,jobs_matched,jobs_applied,jobs_failed,started_at,completed_at",
    )
    .eq("user_id", user.id);

  if (runsResult.error) {
    console.error("[dashboard/loadDashboard/runs]", runsResult.error);
    return {
      success: false,
      error: "Could not load your dashboard overview. Try refreshing the page.",
    };
  }

  const manualAppliedResult = await insforge.database
    .from("jobs")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "applied")
    .eq("is_tailored", true);

  if (manualAppliedResult.error) {
    console.error(
      "[dashboard/loadDashboard/manualApplied]",
      manualAppliedResult.error,
    );
    return {
      success: false,
      error: "Could not load your dashboard stats. Try refreshing the page.",
    };
  }

  const manuallyApplied = Array.isArray(manualAppliedResult.data)
    ? manualAppliedResult.data.length
    : 0;

  return {
    success: true,
    stats: getDashboardStats(runsResult.data, manuallyApplied),
    runSummary: normalizeRunSummary(runsResult.data),
  };
}

function DashboardLoadError({ message }: { message: string }) {
  return (
    <section className="rounded-2xl border border-default bg-surface">
      <div className="border-b border-default px-5 py-4">
        <p className="text-sm text-accent-text">Dashboard</p>
        <h1 className="mt-1 text-3xl font-semibold text-text-primary">
          Overview
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

export default async function DashboardPage() {
  const dashboardResult = await loadDashboard();

  return (
    <section>
      {dashboardResult.success ? (
        <div className="grid gap-6">
          <div>
            <p className="text-sm text-accent-text">Dashboard</p>
            <h1 className="mt-1 text-3xl font-semibold text-text-primary">
              Overview
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-text-muted">
              Track the health of your job search and the latest agent run.
            </p>
          </div>
          <StatsBar stats={dashboardResult.stats} />
          <RunSummary run={dashboardResult.runSummary} />
          <AnalyticsPreview />
        </div>
      ) : (
        <DashboardLoadError message={dashboardResult.error} />
      )}
    </section>
  );
}
