"use server";

import { revalidatePath } from "next/cache";

import { getAccessToken, getCurrentUser } from "@/lib/auth";
import { createInsforgeServer } from "@/lib/insforge-server";
import type { JobActionResult } from "@/types";

export async function dismissReviewJob(
  jobId: string,
): Promise<JobActionResult> {
  try {
    const normalizedJobId = jobId.trim();

    if (!normalizedJobId) {
      return {
        success: false,
        error: "Could not dismiss this job. Refresh and try again.",
      };
    }

    const user = await getCurrentUser({ persistCookies: true });
    const accessToken = await getAccessToken({ persistCookies: true });

    if (!user || !accessToken) {
      return {
        success: false,
        error: "Your session expired. Sign in again to dismiss this job.",
      };
    }

    const insforge = createInsforgeServer(accessToken);
    const result = await insforge.database
      .from("jobs")
      .update({ status: "dismissed" })
      .eq("id", normalizedJobId)
      .eq("user_id", user.id)
      .eq("status", "found")
      .select("id");

    if (result.error) {
      console.error("[actions/jobs/dismissReviewJob]", result.error);
      return {
        success: false,
        error: "Could not dismiss this job. Try again.",
      };
    }

    revalidatePath("/dashboard");
    revalidatePath("/jobs");

    return { success: true };
  } catch (error) {
    console.error("[actions/jobs/dismissReviewJob]", error);
    return {
      success: false,
      error: "Could not dismiss this job. Try again.",
    };
  }
}
