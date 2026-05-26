import { NextResponse } from "next/server";

import { getAccessToken, getCurrentUser } from "@/lib/auth";
import { createInsforgeServer } from "@/lib/insforge-server";
import { getBaseResumePathForUser } from "@/lib/resume";

type ApiResponse = {
  success: false;
  error: string;
};

function jsonResponse(body: ApiResponse, status: number): NextResponse {
  return NextResponse.json(body, { status });
}

function getPreviewFileName(name: string | null | undefined): string {
  const safeName =
    typeof name === "string" && name.trim()
      ? name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-")
      : "jobpilot";

  return `${safeName}-resume.pdf`;
}

export async function GET(): Promise<Response> {
  try {
    const accessToken = await getAccessToken({ persistCookies: true });
    const user = await getCurrentUser({ persistCookies: true });

    if (!user || !accessToken) {
      return jsonResponse(
        { success: false, error: "Sign in again to preview your resume." },
        401,
      );
    }

    const insforge = createInsforgeServer(accessToken);
    const resumePath = getBaseResumePathForUser(user.id);
    const previewResult = await insforge.storage
      .from("resumes")
      .download(resumePath);

    if (previewResult.error || !previewResult.data) {
      console.error("[api/resume/preview]", previewResult.error);
      return jsonResponse(
        { success: false, error: "Generate your resume before previewing it." },
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
    console.error("[api/resume/preview]", error);
    return jsonResponse(
      { success: false, error: "Could not preview your resume." },
      500,
    );
  }
}
