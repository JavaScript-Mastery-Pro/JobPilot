import "server-only";

import OpenAI from "openai";

import { createInsforgeServer } from "@/lib/insforge-server";

type GenerateCoverLettersInput = {
  accessToken: string;
  userId: string;
  runId: string;
  previousFailedJobs?: number;
};

type GenerateCoverLettersResult = {
  success: boolean;
  data?: {
    generatedLetters: number;
    failedLetters: number;
  };
  error?: string;
};

export type GenerateSingleCoverLetterInput = {
  accessToken: string;
  userId: string;
  runId: string;
  jobId: string;
};

export type GenerateSingleCoverLetterResult = {
  success: boolean;
  data?: {
    coverLetter: string;
  };
  error?: string;
};

type AgentLogLevel = "info" | "success" | "warning" | "error";

type ProfileRow = {
  full_name: string;
  email: string;
  phone: string;
  location: string;
  job_title: string;
  experience_level: string;
  years_experience: number;
  skills: string[];
  remote_preference: string;
  cover_letter_tone: string;
  linkedin_url: string;
  portfolio_url: string;
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
  match_score: number;
  match_reason: string;
};

type CoverLetterResponse = {
  coverLetter: string;
};

function getOpenAIClient(): OpenAI {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("Missing OPENAI_API_KEY.");
  }

  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object";
}

function getStringValue(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function isProfileRow(value: unknown): value is ProfileRow {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.full_name === "string" &&
    typeof value.email === "string" &&
    typeof value.phone === "string" &&
    typeof value.location === "string" &&
    typeof value.job_title === "string" &&
    typeof value.experience_level === "string" &&
    typeof value.years_experience === "number" &&
    Array.isArray(value.skills) &&
    typeof value.remote_preference === "string" &&
    typeof value.cover_letter_tone === "string" &&
    typeof value.linkedin_url === "string" &&
    typeof value.portfolio_url === "string" &&
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
    typeof value.description === "string" &&
    typeof value.match_score === "number" &&
    typeof value.match_reason === "string"
  );
}

function getJobRows(value: unknown): JobRow[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((row: unknown): row is JobRow => isJobRow(row));
}

function normalizeCoverLetterResponse(
  value: unknown,
): CoverLetterResponse | null {
  if (!isRecord(value)) {
    return null;
  }

  const coverLetter = getStringValue(value.coverLetter);

  if (!coverLetter) {
    return null;
  }

  return {
    coverLetter,
  };
}

function buildCoverLetterPayload(profile: ProfileRow, job: JobRow): object {
  return {
    profile: {
      name: profile.full_name,
      email: profile.email,
      phone: profile.phone,
      location: profile.location,
      targetRole: profile.job_title,
      experienceLevel: profile.experience_level,
      yearsExperience: profile.years_experience,
      skills: profile.skills,
      remotePreference: profile.remote_preference,
      tone: profile.cover_letter_tone,
      links: {
        linkedin: profile.linkedin_url,
        portfolio: profile.portfolio_url,
      },
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
      matchScore: job.match_score,
      matchReason: job.match_reason,
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
    console.error("[agent/cover-letter/log]", result.error);
  }
}

async function loadProfile(
  input: GenerateCoverLettersInput,
): Promise<ProfileRow | null> {
  const insforge = createInsforgeServer(input.accessToken);
  const result = await insforge.database
    .from("profiles")
    .select(
      "full_name,email,phone,location,job_title,experience_level,years_experience,skills,remote_preference,cover_letter_tone,linkedin_url,portfolio_url,resume_work_experience,resume_projects,resume_education,resume_achievements",
    )
    .eq("id", input.userId)
    .maybeSingle();

  if (result.error) {
    console.error("[agent/cover-letter/loadProfile]", result.error);
    return null;
  }

  return isProfileRow(result.data) ? result.data : null;
}

async function loadQueuedJobs(
  input: GenerateCoverLettersInput,
): Promise<JobRow[]> {
  const insforge = createInsforgeServer(input.accessToken);
  const result = await insforge.database
    .from("jobs")
    .select(
      "id,title,company,location,external_apply_url,description,match_score,match_reason",
    )
    .eq("run_id", input.runId)
    .eq("user_id", input.userId)
    .eq("status", "queued");

  if (result.error) {
    console.error("[agent/cover-letter/loadQueuedJobs]", result.error);
    return [];
  }

  return getJobRows(result.data);
}

async function loadCoverLetterJob(input: {
  accessToken: string;
  userId: string;
  runId: string;
  jobId: string;
}): Promise<JobRow | null> {
  const insforge = createInsforgeServer(input.accessToken);
  const result = await insforge.database
    .from("jobs")
    .select(
      "id,title,company,location,external_apply_url,description,match_score,match_reason",
    )
    .eq("id", input.jobId)
    .eq("run_id", input.runId)
    .eq("user_id", input.userId)
    .maybeSingle();

  if (result.error) {
    console.error("[agent/cover-letter/loadCoverLetterJob]", result.error);
    return null;
  }

  return isJobRow(result.data) ? result.data : null;
}

async function generateCoverLetter(input: {
  openai: OpenAI;
  profile: ProfileRow;
  job: JobRow;
}): Promise<CoverLetterResponse> {
  const response = await input.openai.chat.completions.create({
    model: "gpt-4o",
    response_format: { type: "json_object" },
    temperature: 0.7,
    max_tokens: 400,
    messages: [
      {
        role: "system",
        content:
          "You write concise, truthful technical cover letters for job applications. Return only valid JSON with key coverLetter. Use the requested tone. Do not invent employers, projects, credentials, or personal details. Do not include markdown, placeholders, addresses, dates, or a subject line.",
      },
      {
        role: "user",
        content: JSON.stringify({
          task: "Generate a custom cover letter for this queued job.",
          input: buildCoverLetterPayload(input.profile, input.job),
          output: {
            coverLetter:
              "A polished cover letter under 250 words, 2-4 short paragraphs, ready to paste into a company application form.",
          },
        }),
      },
    ],
  });
  const content = response.choices[0]?.message.content;

  if (typeof content !== "string" || !content.trim()) {
    throw new Error("OpenAI returned empty cover letter content.");
  }

  const parsed: unknown = JSON.parse(content);
  const coverLetter = normalizeCoverLetterResponse(parsed);

  if (!coverLetter) {
    throw new Error("OpenAI returned invalid cover letter content.");
  }

  return coverLetter;
}

async function updateJobCoverLetter(input: {
  accessToken: string;
  jobId: string;
  coverLetter: string;
}): Promise<boolean> {
  const insforge = createInsforgeServer(input.accessToken);
  const result = await insforge.database
    .from("jobs")
    .update({
      cover_letter: input.coverLetter,
      error_message: null,
    })
    .eq("id", input.jobId)
    .select("id");

  if (result.error) {
    console.error("[agent/cover-letter/updateJobCoverLetter]", result.error);
    return false;
  }

  return true;
}

async function markJobCoverLetterFailed(input: {
  accessToken: string;
  jobId: string;
}): Promise<void> {
  const insforge = createInsforgeServer(input.accessToken);
  const result = await insforge.database
    .from("jobs")
    .update({
      status: "failed",
      error_message: "Could not generate a cover letter.",
    })
    .eq("id", input.jobId);

  if (result.error) {
    console.error("[agent/cover-letter/markJobCoverLetterFailed]", result.error);
  }
}

async function updateRunAfterCoverLetters(input: {
  accessToken: string;
  runId: string;
  previousFailedJobs?: number;
  failedLetters: number;
}): Promise<void> {
  const insforge = createInsforgeServer(input.accessToken);
  const result = await insforge.database
    .from("agent_runs")
    .update({
      status: "completed",
      jobs_failed: (input.previousFailedJobs ?? 0) + input.failedLetters,
      completed_at: new Date().toISOString(),
    })
    .eq("id", input.runId);

  if (result.error) {
    console.error("[agent/cover-letter/updateRunAfterCoverLetters]", result.error);
  }
}

export async function generateCoverLettersForQueuedJobs(
  input: GenerateCoverLettersInput,
): Promise<GenerateCoverLettersResult> {
  try {
    await logAgentMessage({
      accessToken: input.accessToken,
      runId: input.runId,
      userId: input.userId,
      level: "info",
      message: "Starting GPT-4o cover letter generation.",
    });

    const profile = await loadProfile(input);

    if (!profile) {
      await logAgentMessage({
        accessToken: input.accessToken,
        runId: input.runId,
        userId: input.userId,
        level: "error",
        message: "Could not load the saved profile for cover letters.",
      });

      return {
        success: false,
        error: "Could not load the saved profile for cover letters.",
      };
    }

    const jobs = await loadQueuedJobs(input);

    if (jobs.length === 0) {
      await updateRunAfterCoverLetters({
        accessToken: input.accessToken,
        runId: input.runId,
        previousFailedJobs: input.previousFailedJobs,
        failedLetters: 0,
      });
      await logAgentMessage({
        accessToken: input.accessToken,
        runId: input.runId,
        userId: input.userId,
        level: "warning",
        message: "No queued jobs were available for cover letter generation.",
      });

      return {
        success: true,
        data: {
          generatedLetters: 0,
          failedLetters: 0,
        },
      };
    }

    const openai = getOpenAIClient();
    let generatedLetters = 0;
    let failedLetters = 0;

    for (const job of jobs) {
      try {
        const coverLetter = await generateCoverLetter({
          openai,
          profile,
          job,
        });
        const updated = await updateJobCoverLetter({
          accessToken: input.accessToken,
          jobId: job.id,
          coverLetter: coverLetter.coverLetter,
        });

        if (!updated) {
          failedLetters += 1;
          await markJobCoverLetterFailed({
            accessToken: input.accessToken,
            jobId: job.id,
          });
          await logAgentMessage({
            accessToken: input.accessToken,
            runId: input.runId,
            userId: input.userId,
            level: "error",
            message: `Could not save the cover letter for ${job.title} at ${job.company}.`,
            jobId: job.id,
          });
          continue;
        }

        generatedLetters += 1;
        await logAgentMessage({
          accessToken: input.accessToken,
          runId: input.runId,
          userId: input.userId,
          level: "success",
          message: `Generated a cover letter for ${job.title} at ${job.company}.`,
          jobId: job.id,
        });
      } catch (error) {
        failedLetters += 1;
        console.error("[agent/cover-letter/job]", error);
        await markJobCoverLetterFailed({
          accessToken: input.accessToken,
          jobId: job.id,
        });
        await logAgentMessage({
          accessToken: input.accessToken,
          runId: input.runId,
          userId: input.userId,
          level: "error",
          message: `Could not generate a cover letter for ${job.title} at ${job.company}.`,
          jobId: job.id,
        });
      }
    }

    await updateRunAfterCoverLetters({
      accessToken: input.accessToken,
      runId: input.runId,
      previousFailedJobs: input.previousFailedJobs,
      failedLetters,
    });

    await logAgentMessage({
      accessToken: input.accessToken,
      runId: input.runId,
      userId: input.userId,
      level: "success",
      message: `GPT-4o cover letter generation finished with ${generatedLetters} letters and ${failedLetters} failures.`,
    });

    return {
      success: true,
      data: {
        generatedLetters,
        failedLetters,
      },
    };
  } catch (error) {
    console.error("[agent/cover-letter]", error);
    await logAgentMessage({
      accessToken: input.accessToken,
      runId: input.runId,
      userId: input.userId,
      level: "error",
      message: "GPT-4o cover letter generation failed.",
    });

    return {
      success: false,
      error: "GPT-4o cover letter generation failed.",
    };
  }
}

export async function generateCoverLetterForJob(
  input: GenerateSingleCoverLetterInput,
): Promise<GenerateSingleCoverLetterResult> {
  try {
    const profile = await loadProfile(input);

    if (!profile) {
      return {
        success: false,
        error: "Could not load the saved profile for cover letter generation.",
      };
    }

    const job = await loadCoverLetterJob(input);

    if (!job) {
      return {
        success: false,
        error: "Could not load this job for cover letter generation.",
      };
    }

    await logAgentMessage({
      accessToken: input.accessToken,
      runId: input.runId,
      userId: input.userId,
      level: "info",
      message: `Generating a cover letter for ${job.title} at ${job.company}.`,
      jobId: job.id,
    });

    const coverLetter = await generateCoverLetter({
      openai: getOpenAIClient(),
      profile,
      job,
    });
    const updated = await updateJobCoverLetter({
      accessToken: input.accessToken,
      jobId: job.id,
      coverLetter: coverLetter.coverLetter,
    });

    if (!updated) {
      return {
        success: false,
        error: "Could not save the generated cover letter.",
      };
    }

    await logAgentMessage({
      accessToken: input.accessToken,
      runId: input.runId,
      userId: input.userId,
      level: "success",
      message: `Generated a cover letter for ${job.title} at ${job.company}.`,
      jobId: job.id,
    });

    return {
      success: true,
      data: {
        coverLetter: coverLetter.coverLetter,
      },
    };
  } catch (error) {
    console.error("[agent/cover-letter/single]", error);
    await logAgentMessage({
      accessToken: input.accessToken,
      runId: input.runId,
      userId: input.userId,
      level: "error",
      message: "Could not generate a cover letter for manual apply.",
      jobId: input.jobId,
    });

    return {
      success: false,
      error: "Could not generate a cover letter for this job.",
    };
  }
}
