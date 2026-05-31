import "server-only";

import {
  applySingleQueuedJob,
  beginApplyToQueuedJobs,
  completeApplyToQueuedJobs,
  failApplyToQueuedJobs,
  type ApplyQueuedJobsInput,
  type ApplyQueuedJobsResult,
} from "@/agent/apply";
import { createInsforgeServer } from "@/lib/insforge-server";

async function logApplyMessage(input: {
  accessToken: string;
  runId: string;
  userId: string;
  level: "info" | "success" | "warning" | "error";
  message: string;
  jobId?: string;
}): Promise<void> {
  const insforge = createInsforgeServer(input.accessToken);
  const result = await insforge.database.from("agent_logs").insert({
    run_id: input.runId,
    user_id: input.userId,
    level: input.level,
    message: input.message,
    job_id: input.jobId,
  });

  if (result.error) {
    console.error("[agent/index/log]", result.error);
  }
}

export async function applyToQueuedJobs(
  input: ApplyQueuedJobsInput,
): Promise<ApplyQueuedJobsResult> {
  const beginResult = await beginApplyToQueuedJobs(input);

  if (!beginResult.success || !beginResult.data) {
    return {
      success: false,
      error: beginResult.error ?? "Could not start auto-apply.",
    };
  }

  if (beginResult.data.jobs.length === 0) {
    return {
      success: true,
      data: {
        appliedJobs: 0,
        failedJobs: 0,
      },
    };
  }

  let appliedJobs = 0;
  let failedJobs = 0;

  try {
    for (const job of beginResult.data.jobs) {
      const stepId = `apply-${job.id}`;
      try {
        const applyResult = await applySingleQueuedJob({
          accessToken: input.accessToken,
          userId: input.userId,
          runId: input.runId,
          jobId: job.id,
          stepId,
        });

        if (applyResult.success && applyResult.data?.applied) {
          appliedJobs += 1;
          await logApplyMessage({
            accessToken: input.accessToken,
            runId: input.runId,
            userId: input.userId,
            level: "success",
            message: `${stepId}: Application submitted successfully.`,
            jobId: job.id,
          });
        } else {
          failedJobs += 1;
          await logApplyMessage({
            accessToken: input.accessToken,
            runId: input.runId,
            userId: input.userId,
            level: "error",
            message: `${stepId}: ${applyResult.error ?? "Application failed."}`,
            jobId: job.id,
          });
        }
      } catch (error) {
        failedJobs += 1;
        await logApplyMessage({
          accessToken: input.accessToken,
          runId: input.runId,
          userId: input.userId,
          level: "error",
          message: `${stepId}: ${error instanceof Error ? error.message : "Application failed."}`,
          jobId: job.id,
        });
      }
    }

    await completeApplyToQueuedJobs({
      accessToken: input.accessToken,
      runId: input.runId,
      userId: input.userId,
      appliedJobs,
      failedJobs,
      previousFailedJobs: beginResult.data.previousFailedJobs,
    });

    return {
      success: true,
      data: {
        appliedJobs,
        failedJobs,
      },
    };
  } catch (error) {
    console.error("[agent/index]", error);
    await failApplyToQueuedJobs(input);

    return {
      success: false,
      error: "Auto-apply failed.",
    };
  }
}
