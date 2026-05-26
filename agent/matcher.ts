import "server-only";

import OpenAI from "openai";

import { createInsforgeServer } from "@/lib/insforge-server";
import { MATCH_THRESHOLD } from "@/lib/utils";

type MatchJobsInput = {
  accessToken: string;
  userId: string;
  runId: string;
};

type MatchJobsResult = {
  success: boolean;
  data?: {
    matchedJobs: number;
    reviewJobs: number;
    failedJobs: number;
  };
  error?: string;
};

type AgentLogLevel = "info" | "success" | "warning" | "error";

type ProfileRow = {
  full_name: string;
  location: string;
  job_title: string;
  experience_level: string;
  years_experience: number;
  skills: string[];
  remote_preference: string;
  resume_work_experience: string;
  resume_projects: string;
  resume_education: string;
  resume_achievements: string;
};

type JobRow = {
  id: string;
  title: string;
  company: string;
  location: string;
  external_apply_url: string;
  description: string;
};

type MatchResponse = {
  score: number;
  reason: string;
};

function getOpenAIClient(): OpenAI {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("Missing OPENAI_API_KEY.");
  }

  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

function getStringValue(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function getNumberValue(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object";
}

function isProfileRow(value: unknown): value is ProfileRow {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.full_name === "string" &&
    typeof value.location === "string" &&
    typeof value.job_title === "string" &&
    typeof value.experience_level === "string" &&
    typeof value.years_experience === "number" &&
    Array.isArray(value.skills) &&
    typeof value.remote_preference === "string" &&
    typeof value.resume_work_experience === "string" &&
    typeof value.resume_projects === "string" &&
    typeof value.resume_education === "string" &&
    typeof value.resume_achievements === "string"
  );
}

function isJobRow(value: unknown): value is JobRow {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    typeof value.title === "string" &&
    typeof value.company === "string" &&
    typeof value.location === "string" &&
    typeof value.external_apply_url === "string" &&
    typeof value.description === "string"
  );
}

function getJobRows(value: unknown): JobRow[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((row: unknown): row is JobRow => isJobRow(row));
}

function normalizeMatchResponse(value: unknown): MatchResponse | null {
  if (!isRecord(value)) {
    return null;
  }

  const rawScore = getNumberValue(value.score);
  const reason = getStringValue(value.reason);

  if (!reason) {
    return null;
  }

  return {
    score: Math.min(Math.max(Math.round(rawScore), 0), 100),
    reason,
  };
}

function buildMatchPayload(profile: ProfileRow, job: JobRow): object {
  return {
    profile: {
      name: profile.full_name,
      targetRole: profile.job_title,
      location: profile.location,
      experienceLevel: profile.experience_level,
      yearsExperience: profile.years_experience,
      skills: profile.skills,
      remotePreference: profile.remote_preference,
      evidence: {
        workExperience: profile.resume_work_experience,
        projects: profile.resume_projects,
        education: profile.resume_education,
        achievements: profile.resume_achievements,
      },
    },
    job: {
      title: job.title,
      company: job.company,
      location: job.location,
      applyUrl: job.external_apply_url,
      description: job.description,
    },
    scoring: {
      strongMatch:
        "Role, seniority, core skills, location or remote preference, and evidence all align.",
      partialMatch:
        "Some requirements align, but seniority, domain, location, or key skills are weak.",
      weakMatch:
        "The role is meaningfully outside the target title, seniority, skills, or location preference.",
    },
  };
}

async function logAgentMessage(input: {
  accessToken: string;
  runId: string;
  userId: string;
  level: AgentLogLevel;
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
    console.error("[agent/matcher/log]", result.error);
  }
}

async function loadProfile(input: MatchJobsInput): Promise<ProfileRow | null> {
  const insforge = createInsforgeServer(input.accessToken);
  const result = await insforge.database
    .from("profiles")
    .select(
      "full_name,location,job_title,experience_level,years_experience,skills,remote_preference,resume_work_experience,resume_projects,resume_education,resume_achievements",
    )
    .eq("id", input.userId)
    .maybeSingle();

  if (result.error) {
    console.error("[agent/matcher/loadProfile]", result.error);
    return null;
  }

  return isProfileRow(result.data) ? result.data : null;
}

async function loadFoundJobs(input: MatchJobsInput): Promise<JobRow[]> {
  const insforge = createInsforgeServer(input.accessToken);
  const result = await insforge.database
    .from("jobs")
    .select("id,title,company,location,external_apply_url,description")
    .eq("run_id", input.runId)
    .eq("user_id", input.userId)
    .eq("status", "found");

  if (result.error) {
    console.error("[agent/matcher/loadFoundJobs]", result.error);
    return [];
  }

  return getJobRows(result.data);
}

async function scoreJob(input: {
  openai: OpenAI;
  profile: ProfileRow;
  job: JobRow;
}): Promise<MatchResponse> {
  const response = await input.openai.chat.completions.create({
    model: "gpt-4o",
    response_format: { type: "json_object" },
    temperature: 0.3,
    max_tokens: 200,
    messages: [
      {
        role: "system",
        content:
          "You are a precise technical recruiting matcher. Return only valid JSON with keys score and reason. Score from 0 to 100. Use only the provided profile and job data. Do not invent missing skills, preferences, or experience. The reason must be one concise sentence for the applicant.",
      },
      {
        role: "user",
        content: JSON.stringify({
          task: "Score this public job posting against the saved applicant profile.",
          input: buildMatchPayload(input.profile, input.job),
          output: {
            score: "Integer from 0 to 100.",
            reason:
              "One concise sentence explaining the strongest fit and the biggest gap.",
          },
        }),
      },
    ],
  });
  const content = response.choices[0]?.message.content;

  if (typeof content !== "string" || !content.trim()) {
    throw new Error("OpenAI returned empty match content.");
  }

  const parsed: unknown = JSON.parse(content);
  const match = normalizeMatchResponse(parsed);

  if (!match) {
    throw new Error("OpenAI returned invalid match content.");
  }

  return match;
}

async function updateJobMatch(input: {
  accessToken: string;
  job: JobRow;
  match: MatchResponse;
}): Promise<boolean> {
  const insforge = createInsforgeServer(input.accessToken);
  const result = await insforge.database
    .from("jobs")
    .update({
      match_score: input.match.score,
      match_reason: input.match.reason,
      status: "found",
    })
    .eq("id", input.job.id)
    .select("id");

  if (result.error) {
    console.error("[agent/matcher/updateJobMatch]", result.error);
    return false;
  }

  return true;
}

async function updateRunCounts(input: {
  accessToken: string;
  runId: string;
  matchedJobs: number;
  reviewJobs: number;
}): Promise<void> {
  const insforge = createInsforgeServer(input.accessToken);
  const result = await insforge.database
    .from("agent_runs")
    .update({
      status: "completed",
      jobs_matched: input.matchedJobs,
      jobs_in_review: input.reviewJobs,
      completed_at: new Date().toISOString(),
    })
    .eq("id", input.runId);

  if (result.error) {
    console.error("[agent/matcher/updateRunCounts]", result.error);
  }
}

export async function matchDiscoveredJobs(
  input: MatchJobsInput,
): Promise<MatchJobsResult> {
  try {
    await logAgentMessage({
      accessToken: input.accessToken,
      runId: input.runId,
      userId: input.userId,
      level: "info",
      message: "Starting GPT-4o job matching.",
    });

    const profile = await loadProfile(input);

    if (!profile) {
      await logAgentMessage({
        accessToken: input.accessToken,
        runId: input.runId,
        userId: input.userId,
        level: "error",
        message: "Could not load the saved profile for matching.",
      });

      return {
        success: false,
        error: "Could not load the saved profile for matching.",
      };
    }

    const jobs = await loadFoundJobs(input);

    if (jobs.length === 0) {
      await updateRunCounts({
        accessToken: input.accessToken,
        runId: input.runId,
        matchedJobs: 0,
        reviewJobs: 0,
      });
      await logAgentMessage({
        accessToken: input.accessToken,
        runId: input.runId,
        userId: input.userId,
        level: "warning",
        message: "No discovered jobs were available for matching.",
      });

      return {
        success: true,
        data: {
          matchedJobs: 0,
          reviewJobs: 0,
          failedJobs: 0,
        },
      };
    }

    const openai = getOpenAIClient();
    let matchedJobs = 0;
    let reviewJobs = 0;
    let failedJobs = 0;

    for (const job of jobs) {
      try {
        const match = await scoreJob({ openai, profile, job });
        const updated = await updateJobMatch({
          accessToken: input.accessToken,
          job,
          match,
        });

        if (!updated) {
          failedJobs += 1;
          await logAgentMessage({
            accessToken: input.accessToken,
            runId: input.runId,
            userId: input.userId,
            level: "error",
            message: `Could not save match score for ${job.title} at ${job.company}.`,
            jobId: job.id,
          });
          continue;
        }

        if (match.score >= MATCH_THRESHOLD) {
          matchedJobs += 1;
          await logAgentMessage({
            accessToken: input.accessToken,
            runId: input.runId,
            userId: input.userId,
            level: "success",
            message: `${job.title} at ${job.company} scored ${match.score} and was saved as a strong match.`,
            jobId: job.id,
          });
        } else {
          reviewJobs += 1;
          await logAgentMessage({
            accessToken: input.accessToken,
            runId: input.runId,
            userId: input.userId,
            level: "warning",
            message: `${job.title} at ${job.company} scored ${match.score} and was sent to review.`,
            jobId: job.id,
          });
        }
      } catch (error) {
        failedJobs += 1;
        console.error("[agent/matcher/job]", error);
        await logAgentMessage({
          accessToken: input.accessToken,
          runId: input.runId,
          userId: input.userId,
          level: "error",
          message: `Could not match ${job.title} at ${job.company}.`,
          jobId: job.id,
        });
      }
    }

    await updateRunCounts({
      accessToken: input.accessToken,
      runId: input.runId,
      matchedJobs,
      reviewJobs,
    });

    await logAgentMessage({
      accessToken: input.accessToken,
      runId: input.runId,
      userId: input.userId,
      level: "success",
      message: `GPT-4o matching finished with ${matchedJobs} strong matches, ${reviewJobs} review matches, and ${failedJobs} failed matches.`,
    });

    return {
      success: true,
      data: {
        matchedJobs,
        reviewJobs,
        failedJobs,
      },
    };
  } catch (error) {
    console.error("[agent/matcher]", error);
    await logAgentMessage({
      accessToken: input.accessToken,
      runId: input.runId,
      userId: input.userId,
      level: "error",
      message: "GPT-4o job matching failed.",
    });

    return {
      success: false,
      error: "GPT-4o job matching failed.",
    };
  }
}
