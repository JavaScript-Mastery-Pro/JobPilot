import { NextRequest, NextResponse } from "next/server";

import { discoverLinkedInJobs } from "@/agent/linkedin";
import { matchDiscoveredJobs } from "@/agent/matcher";
import { getAccessToken, getCurrentUser } from "@/lib/auth";
import { createInsforgeServer } from "@/lib/insforge-server";

type ApiResponse =
  | {
      success: true;
      data: {
        runId: string;
        savedJobs: number;
        skippedJobs: number;
        matchedJobs: number;
        reviewJobs: number;
        failedMatches: number;
        generatedCoverLetters: number;
        failedCoverLetters: number;
        recordingUrl: string;
      };
    }
  | {
      success: false;
      error: string;
    };

type RequestBody = {
  jobTitle?: unknown;
  location?: unknown;
  limit?: unknown;
};

type AgentRunRow = {
  id?: unknown;
};

function jsonResponse(body: ApiResponse, status: number): NextResponse {
  return NextResponse.json(body, { status });
}

function isRequestBody(value: unknown): value is RequestBody {
  return value !== null && typeof value === "object";
}

function isAgentRunRow(value: unknown): value is AgentRunRow {
  return value !== null && typeof value === "object";
}

async function parseRequestBody(request: NextRequest): Promise<RequestBody | null> {
  try {
    const body: unknown = await request.json();
    return isRequestBody(body) ? body : null;
  } catch {
    return null;
  }
}

function getStringValue(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function getLimit(value: unknown): number {
  if (!Number.isInteger(value) || typeof value !== "number") {
    return 10;
  }

  return Math.min(Math.max(value, 1), 20);
}

function getRunId(value: unknown): string {
  if (!isAgentRunRow(value)) {
    return "";
  }

  return typeof value.id === "string" ? value.id : "";
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const accessToken = await getAccessToken({ persistCookies: true });
    const user = await getCurrentUser({ persistCookies: true });

    if (!user || !accessToken) {
      return jsonResponse(
        { success: false, error: "Sign in again to find jobs." },
        401,
      );
    }

    const body = await parseRequestBody(request);

    if (!body) {
      return jsonResponse(
        { success: false, error: "Enter a job title and location." },
        400,
      );
    }

    const jobTitle = getStringValue(body.jobTitle);
    const location = getStringValue(body.location);
    const limit = getLimit(body.limit);

    if (!jobTitle || !location) {
      return jsonResponse(
        { success: false, error: "Enter a job title and location." },
        400,
      );
    }

    const insforge = createInsforgeServer(accessToken);
    const runResult = await insforge.database
      .from("agent_runs")
      .insert({
        user_id: user.id,
        status: "finding",
        job_title_searched: jobTitle,
        location_searched: location,
        jobs_found: 0,
        jobs_matched: 0,
        jobs_applied: 0,
        jobs_failed: 0,
        jobs_in_review: 0,
        started_at: new Date().toISOString(),
      })
      .select();

    if (runResult.error || !Array.isArray(runResult.data)) {
      console.error("[agent/find]", runResult.error);
      return jsonResponse(
        { success: false, error: "Could not start a job discovery run." },
        500,
      );
    }

    const runId = getRunId(runResult.data[0]);

    if (!runId) {
      return jsonResponse(
        { success: false, error: "Could not start a job discovery run." },
        500,
      );
    }

    const discoveryResult = await discoverLinkedInJobs({
      accessToken,
      userId: user.id,
      runId,
      jobTitle,
      location,
      limit,
    });

    if (!discoveryResult.success || !discoveryResult.data) {
      return jsonResponse(
        {
          success: false,
          error: discoveryResult.error ?? "Could not find jobs.",
        },
        500,
      );
    }

    const matchResult = await matchDiscoveredJobs({
      accessToken,
      userId: user.id,
      runId,
    });

    if (!matchResult.success || !matchResult.data) {
      return jsonResponse(
        {
          success: false,
          error: matchResult.error ?? "Could not score discovered jobs.",
        },
        500,
      );
    }

    return jsonResponse(
      {
        success: true,
        data: {
          runId,
          savedJobs: discoveryResult.data.savedJobs,
          skippedJobs: discoveryResult.data.skippedJobs,
          matchedJobs: matchResult.data.matchedJobs,
          reviewJobs: matchResult.data.reviewJobs,
          failedMatches: matchResult.data.failedJobs,
          generatedCoverLetters: 0,
          failedCoverLetters: 0,
          recordingUrl: discoveryResult.data.recordingUrl,
        },
      },
      200,
    );
  } catch (error) {
    console.error("[agent/find]", error);
    return jsonResponse(
      { success: false, error: "Could not find jobs." },
      500,
    );
  }
}
