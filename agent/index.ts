import "server-only";

import { Agent, AgentRuntime, tool, type AgentResult } from "@agentspan-ai/sdk";

import {
  applySingleQueuedJob,
  beginApplyToQueuedJobs,
  completeApplyToQueuedJobs,
  failApplyToQueuedJobs,
  type ApplyQueuedJobsInput,
  type ApplyQueuedJobsResult,
} from "@/agent/apply";
import { createInsforgeServer } from "@/lib/insforge-server";

type ApplyQueuedJobToolInput = {
  accessToken: string;
  userId: string;
  runId: string;
  jobId: string;
  stepId: string;
};

type JobStatus = {
  status: string;
};

const applyQueuedJobInputSchema = {
  type: "object",
  properties: {
    accessToken: { type: "string" },
    userId: { type: "string" },
    runId: { type: "string" },
    jobId: { type: "string" },
    stepId: {
      type: "string",
      description: "Checkpoint step ID. Must use apply-{job_id}.",
    },
  },
  required: ["accessToken", "userId", "runId", "jobId", "stepId"],
  additionalProperties: false,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object";
}

function isApplyQueuedJobToolInput(
  value: unknown,
): value is ApplyQueuedJobToolInput {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.accessToken === "string" &&
    typeof value.userId === "string" &&
    typeof value.runId === "string" &&
    typeof value.jobId === "string" &&
    typeof value.stepId === "string"
  );
}

function isJobStatus(value: unknown): value is JobStatus {
  return isRecord(value) && typeof value.status === "string";
}

async function logAgentSpanMessage(input: {
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

async function saveAgentSpanRunId(input: {
  accessToken: string;
  runId: string;
  agentspanRunId: string;
}): Promise<void> {
  const insforge = createInsforgeServer(input.accessToken);
  const result = await insforge.database
    .from("agent_runs")
    .update({
      agentspan_run_id: input.agentspanRunId,
    })
    .eq("id", input.runId);

  if (result.error) {
    console.error("[agent/index/saveAgentSpanRunId]", result.error);
  }
}

async function loadJobStatus(input: {
  accessToken: string;
  userId: string;
  runId: string;
  jobId: string;
}): Promise<string> {
  const insforge = createInsforgeServer(input.accessToken);
  const result = await insforge.database
    .from("jobs")
    .select("status")
    .eq("id", input.jobId)
    .eq("run_id", input.runId)
    .eq("user_id", input.userId)
    .maybeSingle();

  if (result.error) {
    console.error("[agent/index/loadJobStatus]", result.error);
    return "";
  }

  return isJobStatus(result.data) ? result.data.status : "";
}

const applyQueuedJobTool = tool<ApplyQueuedJobToolInput, { applied: boolean }>(
  async (args: ApplyQueuedJobToolInput): Promise<{ applied: boolean }> => {
    if (!isApplyQueuedJobToolInput(args)) {
      throw new Error("Invalid apply queued job input.");
    }

    const expectedStepId = `apply-${args.jobId}`;

    if (args.stepId !== expectedStepId) {
      throw new Error(`Step ID must be ${expectedStepId}.`);
    }

    const result = await applySingleQueuedJob(args);

    if (!result.success || !result.data) {
      throw new Error(result.error ?? "Could not apply to queued job.");
    }

    return {
      applied: result.data.applied,
    };
  },
  {
    name: "apply_queued_job",
    description:
      "Apply to exactly one queued JobPilot job using its checkpoint step ID.",
    inputSchema: applyQueuedJobInputSchema,
    timeoutSeconds: 900,
  },
);

const jobPilotApplyAgent = new Agent({
  name: "jobpilot_apply_agent",
  model: "openai/gpt-4o",
  instructions:
    "You are the durable runtime wrapper for JobPilot auto-apply. Call apply_queued_job exactly once using the provided JSON values. Do not invent, transform, or omit any fields. Return whether the tool reported an applied application.",
  tools: [applyQueuedJobTool],
  maxTurns: 3,
  temperature: 0,
  requiredTools: ["apply_queued_job"],
  metadata: {
    feature: "agent-span-apply",
  },
});

function buildApplyPrompt(input: ApplyQueuedJobToolInput): string {
  return JSON.stringify({
    task: "Call apply_queued_job exactly once with these values.",
    input,
  });
}

async function runAgentSpanJob(input: {
  runtime: AgentRuntime;
  accessToken: string;
  userId: string;
  runId: string;
  jobId: string;
}): Promise<AgentResult> {
  const stepId = `apply-${input.jobId}`;

  return input.runtime.run(jobPilotApplyAgent, buildApplyPrompt({ ...input, stepId }), {
    sessionId: input.runId,
    idempotencyKey: stepId,
    timeoutSeconds: 1_200,
    context: {
      stepId,
      jobId: input.jobId,
      runId: input.runId,
    },
  });
}

export async function applyToQueuedJobsWithAgentSpan(
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

  const runtime = new AgentRuntime({
    serverUrl: process.env.AGENTSPAN_SERVER_URL ?? "http://localhost:6767/api",
  });
  let appliedJobs = 0;
  let failedJobs = 0;
  let savedAgentSpanRunId = false;

  try {
    for (const job of beginResult.data.jobs) {
      const stepId = `apply-${job.id}`;
      const result = await runAgentSpanJob({
        runtime,
        accessToken: input.accessToken,
        userId: input.userId,
        runId: input.runId,
        jobId: job.id,
      });

      if (!savedAgentSpanRunId) {
        await saveAgentSpanRunId({
          accessToken: input.accessToken,
          runId: input.runId,
          agentspanRunId: result.executionId,
        });
        savedAgentSpanRunId = true;
      }

      await logAgentSpanMessage({
        accessToken: input.accessToken,
        runId: input.runId,
        userId: input.userId,
        level: result.isSuccess ? "info" : "error",
        message: `${stepId}: AgentSpan execution ${result.executionId} finished with status ${result.status}.`,
        jobId: job.id,
      });

      const status = await loadJobStatus({
        accessToken: input.accessToken,
        userId: input.userId,
        runId: input.runId,
        jobId: job.id,
      });

      if (result.isSuccess && status === "applied") {
        appliedJobs += 1;
      } else {
        failedJobs += 1;
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
      error: "AgentSpan auto-apply failed.",
    };
  } finally {
    await runtime.shutdown();
  }
}
