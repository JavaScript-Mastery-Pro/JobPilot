import { NextResponse } from "next/server";

import { getAccessToken, getCurrentUser } from "@/lib/auth";
import { createInsforgeServer } from "@/lib/insforge-server";

type ApiResponse =
  | {
      success: true;
      data: {
        stopped: boolean;
        runId?: string;
      };
    }
  | {
      success: false;
      error: string;
    };

type ActiveRunRow = {
  id?: unknown;
  status?: unknown;
  job_title_searched?: unknown;
  location_searched?: unknown;
  started_at?: unknown;
  completed_at?: unknown;
};

function jsonResponse(body: ApiResponse, status: number): NextResponse {
  return NextResponse.json(body, { status });
}

function isActiveRunRow(value: unknown): value is ActiveRunRow {
  return value !== null && typeof value === "object";
}

function getStringValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function normalizeActiveRun(row: ActiveRunRow): ActiveRunRow | null {
  const id = getStringValue(row.id);
  const status = getStringValue(row.status);
  const isActiveStatus =
    status === "finding" || status === "applying" || status === "running";

  if (!id || !isActiveStatus || getStringValue(row.completed_at)) {
    return null;
  }

  return row;
}

function getLatestActiveRun(data: unknown): ActiveRunRow | null {
  if (!Array.isArray(data)) {
    return null;
  }

  const activeRuns = data
    .filter(isActiveRunRow)
    .map((row: ActiveRunRow) => normalizeActiveRun(row))
    .filter((run: ActiveRunRow | null): run is ActiveRunRow => run !== null);

  activeRuns.sort((firstRun, secondRun) => {
    return getStringValue(secondRun.started_at).localeCompare(
      getStringValue(firstRun.started_at),
    );
  });

  return activeRuns[0] ?? null;
}

export async function POST(): Promise<NextResponse> {
  try {
    const accessToken = await getAccessToken({ persistCookies: true });
    const user = await getCurrentUser({ persistCookies: true });

    if (!user || !accessToken) {
      return jsonResponse(
        { success: false, error: "Sign in again to stop the agent." },
        401,
      );
    }

    const insforge = createInsforgeServer(accessToken);
    const activeRunsResult = await insforge.database
      .from("agent_runs")
      .select(
        "id,status,job_title_searched,location_searched,started_at,completed_at",
      )
      .eq("user_id", user.id);

    if (activeRunsResult.error) {
      console.error("[agent/stop/loadActiveRun]", activeRunsResult.error);
      return jsonResponse(
        { success: false, error: "Could not find an active agent run." },
        500,
      );
    }

    const activeRun = getLatestActiveRun(activeRunsResult.data);
    const runId = getStringValue(activeRun?.id);

    if (!runId) {
      return jsonResponse(
        {
          success: true,
          data: {
            stopped: false,
          },
        },
        200,
      );
    }

    const stoppedAt = new Date().toISOString();
    const stopResult = await insforge.database
      .from("agent_runs")
      .update({
        status: "stopped",
        completed_at: stoppedAt,
      })
      .eq("id", runId)
      .eq("user_id", user.id)
      .select("id");

    if (stopResult.error) {
      console.error("[agent/stop/updateRun]", stopResult.error);
      return jsonResponse(
        { success: false, error: "Could not stop the active agent run." },
        500,
      );
    }

    const logResult = await insforge.database.from("agent_logs").insert({
      run_id: runId,
      user_id: user.id,
      level: "warning",
      message: "Agent run stopped by the user.",
    });

    if (logResult.error) {
      console.error("[agent/stop/log]", logResult.error);
    }

    return jsonResponse(
      {
        success: true,
        data: {
          stopped: true,
          runId,
        },
      },
      200,
    );
  } catch (error) {
    console.error("[agent/stop]", error);
    return jsonResponse(
      { success: false, error: "Could not stop the agent." },
      500,
    );
  }
}
