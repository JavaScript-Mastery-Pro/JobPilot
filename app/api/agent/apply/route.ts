import { NextRequest, NextResponse } from "next/server";

import { applyToQueuedJobs } from "@/agent";
import { getAccessToken, getCurrentUser } from "@/lib/auth";

type ApiResponse =
  | {
      success: true;
      data: {
        appliedJobs: number;
        failedJobs: number;
      };
    }
  | {
      success: false;
      error: string;
    };

type RequestBody = {
  runId?: unknown;
};

function jsonResponse(body: ApiResponse, status: number): NextResponse {
  return NextResponse.json(body, { status });
}

function isRequestBody(value: unknown): value is RequestBody {
  return value !== null && typeof value === "object";
}

async function parseRequestBody(
  request: NextRequest,
): Promise<RequestBody | null> {
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

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const accessToken = await getAccessToken({ persistCookies: true });
    const user = await getCurrentUser({ persistCookies: true });

    if (!user || !accessToken) {
      return jsonResponse(
        { success: false, error: "Sign in again to apply to jobs." },
        401,
      );
    }

    const body = await parseRequestBody(request);

    if (!body) {
      return jsonResponse(
        { success: false, error: "Choose an agent run to apply from." },
        400,
      );
    }

    const runId = getStringValue(body.runId);

    if (!runId) {
      return jsonResponse(
        { success: false, error: "Choose an agent run to apply from." },
        400,
      );
    }

    const applyResult = await applyToQueuedJobs({
      accessToken,
      userId: user.id,
      runId,
    });

    if (!applyResult.success || !applyResult.data) {
      return jsonResponse(
        {
          success: false,
          error: applyResult.error ?? "Could not apply to queued jobs.",
        },
        500,
      );
    }

    return jsonResponse(
      {
        success: true,
        data: {
          appliedJobs: applyResult.data.appliedJobs,
          failedJobs: applyResult.data.failedJobs,
        },
      },
      200,
    );
  } catch (error) {
    console.error("[agent/apply]", error);
    return jsonResponse(
      { success: false, error: "Could not apply to queued jobs." },
      500,
    );
  }
}
