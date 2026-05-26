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

function getDownloadFileName(name: string | null | undefined): string {
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
        { success: false, error: "Sign in again to download your resume." },
        401,
      );
    }

    const insforge = createInsforgeServer(accessToken);
    const resumePath = getBaseResumePathForUser(user.id);
    const downloadResult = await insforge.storage
      .from("resumes")
      .download(resumePath);

    if (downloadResult.error || !downloadResult.data) {
      console.error("[api/resume/download]", downloadResult.error);
      return jsonResponse(
        { success: false, error: "Generate your resume before downloading it." },
        404,
      );
    }

    return new Response(downloadResult.data, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${getDownloadFileName(
          user.email,
        )}"`,
      },
    });
  } catch (error) {
    console.error("[api/resume/download]", error);
    return jsonResponse(
      { success: false, error: "Could not download your resume." },
      500,
    );
  }
}
