import { NextResponse } from "next/server";

import { getAccessToken, getCurrentUser } from "@/lib/auth";
import { createInsforgeServer } from "@/lib/insforge-server";
import { getTailoredResumePathForJob } from "@/lib/resume";

type ApiResponse = {
  success: false;
  error: string;
};

type JobRow = {
  is_tailored?: unknown;
  resume_url?: unknown;
};

function jsonResponse(body: ApiResponse, status: number): NextResponse {
  return NextResponse.json(body, { status });
}

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isJobRow(value: unknown): value is JobRow {
  return isObject(value);
}

function getFirstJobRow(data: unknown): JobRow | null {
  if (Array.isArray(data) && data.length > 0 && isJobRow(data[0])) {
    return data[0];
  }

  if (isJobRow(data)) {
    return data;
  }

  return null;
}

function getStringValue(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function getPreviewFileName(name: string | null | undefined): string {
  const safeName =
    typeof name === "string" && name.trim()
      ? name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-")
      : "jobpilot";

  return `${safeName}-tailored-resume.pdf`;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    const { id } = await params;
    const jobId = id.trim();
    const accessToken = await getAccessToken({ persistCookies: true });
    const user = await getCurrentUser({ persistCookies: true });

    if (!user || !accessToken) {
      return jsonResponse(
        { success: false, error: "Sign in again to preview this resume." },
        401,
      );
    }

    if (!jobId) {
      return jsonResponse(
        { success: false, error: "Choose a job before previewing this resume." },
        400,
      );
    }

    const insforge = createInsforgeServer(accessToken);
    const jobResult = await insforge.database
      .from("jobs")
      .select("resume_url,is_tailored")
      .eq("id", jobId)
      .eq("user_id", user.id)
      .limit(1);

    if (jobResult.error) {
      console.error("[api/resume/jobs/preview]", jobResult.error);
      return jsonResponse(
        { success: false, error: "Could not load this tailored resume." },
        500,
      );
    }

    const jobRow = getFirstJobRow(jobResult.data);

    if (
      !jobRow ||
      jobRow.is_tailored !== true ||
      !getStringValue(jobRow.resume_url)
    ) {
      return jsonResponse(
        { success: false, error: "Tailor this resume before previewing it." },
        404,
      );
    }

    const resumePath = getTailoredResumePathForJob(user.id, jobId);
    const previewResult = await insforge.storage
      .from("resumes")
      .download(resumePath);

    if (previewResult.error || !previewResult.data) {
      console.error("[api/resume/jobs/preview]", previewResult.error);
      return jsonResponse(
        { success: false, error: "Could not preview this tailored resume." },
        404,
      );
    }

    return new Response(previewResult.data, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${getPreviewFileName(
          user.email,
        )}"`,
      },
    });
  } catch (error) {
    console.error("[api/resume/jobs/preview]", error);
    return jsonResponse(
      { success: false, error: "Could not preview this tailored resume." },
      500,
    );
  }
}
