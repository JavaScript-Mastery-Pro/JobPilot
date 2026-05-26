import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { applyManualJob } from "@/agent/apply";
import { getAccessToken, getCurrentUser } from "@/lib/auth";

type ApiResponse =
  | {
      success: true;
      data: {
        applied: boolean;
      };
    }
  | {
      success: false;
      error: string;
    };

function jsonResponse(body: ApiResponse, status: number): NextResponse {
  return NextResponse.json(body, { status });
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const jobId = id.trim();
    const accessToken = await getAccessToken({ persistCookies: true });
    const user = await getCurrentUser({ persistCookies: true });

    if (!user || !accessToken) {
      return jsonResponse(
        { success: false, error: "Sign in again to apply to this job." },
        401,
      );
    }

    if (!jobId) {
      return jsonResponse(
        { success: false, error: "Choose a job before applying." },
        400,
      );
    }

    const applyResult = await applyManualJob({
      accessToken,
      userId: user.id,
      jobId,
    });

    if (!applyResult.success || !applyResult.data) {
      return jsonResponse(
        {
          success: false,
          error: applyResult.error ?? "Could not apply to this job.",
        },
        400,
      );
    }

    if (!applyResult.data.applied) {
      return jsonResponse(
        { success: false, error: "Could not submit this application." },
        500,
      );
    }

    revalidatePath(`/jobs/${jobId}`);
    revalidatePath("/dashboard");

    return jsonResponse(
      {
        success: true,
        data: {
          applied: true,
        },
      },
      200,
    );
  } catch (error) {
    console.error("[api/jobs/apply]", error);
    return jsonResponse(
      { success: false, error: "Could not apply to this job." },
      500,
    );
  }
}
