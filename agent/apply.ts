import "server-only";

import { randomUUID } from "crypto";
import { unlink, writeFile } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";

import { z } from "zod";

import {
  closeStagehandSession,
  createStagehandSession,
  type StagehandSession,
} from "@/lib/stagehand";
import { generateCoverLetterForJob } from "@/agent/cover-letter";
import { saveBrowserbaseRecording } from "@/agent/recording";
import { createInsforgeServer } from "@/lib/insforge-server";

export type ApplyQueuedJobsInput = {
  accessToken: string;
  userId: string;
  runId: string;
};

export type ApplyQueuedJobsResult = {
  success: boolean;
  data?: {
    appliedJobs: number;
    failedJobs: number;
  };
  error?: string;
};

export type QueuedApplyJob = {
  id: string;
  title: string;
  company: string;
};

export type BeginApplyQueuedJobsResult = {
  success: boolean;
  data?: {
    jobs: QueuedApplyJob[];
    previousFailedJobs: number;
  };
  error?: string;
};

export type ApplySingleQueuedJobInput = ApplyQueuedJobsInput & {
  jobId: string;
  stepId: string;
};

export type ApplySingleQueuedJobResult = {
  success: boolean;
  data?: {
    applied: boolean;
  };
  error?: string;
};

export type ApplyManualJobInput = {
  accessToken: string;
  userId: string;
  jobId: string;
};

export type ApplyManualJobResult = {
  success: boolean;
  data?: {
    applied: boolean;
    needsReview?: boolean;
    sessionRecordingUrl?: string;
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
  linkedin_url: string;
  portfolio_url: string;
  resume_work_experience: string;
  resume_projects: string;
  resume_education: string;
  resume_achievements: string;
  work_authorization: string;
  sponsorship_requirement: string;
  salary_expectation: string;
  start_availability: string;
  relocation_preference: string;
  background_check_consent: string;
  gender_identity: string;
  hispanic_latino_identity: string;
  veteran_status: string;
  disability_status: string;
  application_notes: string;
  resume_pdf_url: string;
  linkedin_context_id?: string;
  linkedin_connected?: boolean;
};

type JobRow = {
  id: string;
  run_id?: string;
  title: string;
  company: string;
  location: string;
  linkedin_url: string;
  external_apply_url: string;
  description: string;
  match_score: number;
  match_reason: string;
  cover_letter: string;
  resume_url?: string;
  is_tailored?: boolean;
  is_easy_apply?: boolean;
  status?: string;
};

type RunRow = {
  jobs_failed: number;
};

const submissionSchema = z.object({
  submitted: z
    .boolean()
    .describe(
      "Whether the page clearly shows the application was submitted or received.",
    ),
  evidence: z
    .string()
    .describe("Short visible evidence from the page supporting the answer."),
});

const externalApplyReviewSchema = z.object({
  filledFields: z
    .array(
      z.object({
        label: z.string().describe("Visible field label or best field name."),
        value: z.string().describe("Current visible value in the field."),
        expectedApplicantField: z
          .string()
          .describe(
            "The applicant variable this field appears to represent, or unknown.",
          ),
        confidence: z
          .enum(["high", "medium", "low"])
          .describe("Confidence that the current value belongs in this field."),
      }),
    )
    .describe("Visible fields that currently contain applicant-provided data."),
  emptyRequiredFields: z
    .array(z.string())
    .describe("Required visible fields that still appear empty."),
  possibleMisfilledFields: z
    .array(
      z.object({
        label: z.string().describe("Visible field label or best field name."),
        value: z.string().describe("Current visible value in the field."),
        reason: z
          .string()
          .describe("Why the value may not belong in this field."),
      }),
    )
    .describe("Fields whose current values look mismatched or suspicious."),
  blockers: z
    .array(z.string())
    .describe("Reasons this application is not safe to submit yet."),
  canSubmit: z
    .boolean()
    .describe("True only if every required field is correctly filled."),
  summary: z
    .string()
    .describe("Short human-readable review summary of the filled form state."),
});

type ExternalApplyReview = z.infer<typeof externalApplyReviewSchema>;

const EXTERNAL_APPLY_AGENT_MODEL = "openai/gpt-4o";

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object";
}

function getStringValue(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function getNumberValue(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
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
    typeof value.linkedin_url === "string" &&
    typeof value.portfolio_url === "string" &&
    typeof value.resume_work_experience === "string" &&
    typeof value.resume_projects === "string" &&
    typeof value.resume_education === "string" &&
    typeof value.resume_achievements === "string" &&
    typeof value.work_authorization === "string" &&
    typeof value.sponsorship_requirement === "string" &&
    typeof value.salary_expectation === "string" &&
    typeof value.start_availability === "string" &&
    typeof value.relocation_preference === "string" &&
    typeof value.background_check_consent === "string" &&
    typeof value.gender_identity === "string" &&
    typeof value.hispanic_latino_identity === "string" &&
    typeof value.veteran_status === "string" &&
    typeof value.disability_status === "string" &&
    typeof value.application_notes === "string" &&
    typeof value.resume_pdf_url === "string"
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

function normalizeJobRow(value: unknown): JobRow | null {
  if (!isRecord(value)) {
    return null;
  }

  const id = getStringValue(value.id);
  const title = getStringValue(value.title);
  const company = getStringValue(value.company);
  const location = getStringValue(value.location);
  const externalApplyUrl = getStringValue(value.external_apply_url);
  const description = getStringValue(value.description);
  const matchScore = getNumberValue(value.match_score);
  const matchReason = getStringValue(value.match_reason);

  if (!id || !title || !company) {
    return null;
  }

  return {
    id,
    run_id: getStringValue(value.run_id) || undefined,
    title,
    company,
    location,
    linkedin_url: getStringValue(value.linkedin_url),
    external_apply_url: externalApplyUrl,
    description,
    match_score: matchScore,
    match_reason: matchReason,
    cover_letter: getStringValue(value.cover_letter),
    resume_url: getStringValue(value.resume_url) || undefined,
    is_tailored:
      typeof value.is_tailored === "boolean" ? value.is_tailored : false,
    is_easy_apply:
      typeof value.is_easy_apply === "boolean"
        ? value.is_easy_apply
        : !externalApplyUrl.trim() &&
          getStringValue(value.linkedin_url).trim() !== "",
    status: getStringValue(value.status) || undefined,
  };
}

function isRunRow(value: unknown): value is RunRow {
  if (!isRecord(value)) {
    return false;
  }

  return typeof value.jobs_failed === "number";
}

function getJobRows(value: unknown): JobRow[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((row: unknown): row is JobRow => isJobRow(row));
}

function getWorkAuthorizationLabel(value: string): string {
  switch (value) {
    case "authorized":
      return "Authorized to work";
    case "not_authorized":
      return "Not currently authorized to work";
    case "prefer_not_to_answer":
      return "Prefer not to answer";
    default:
      return "";
  }
}

function getSponsorshipLabel(value: string): string {
  switch (value) {
    case "no":
      return "No sponsorship needed";
    case "yes_now":
      return "Needs sponsorship now";
    case "yes_future":
      return "May need sponsorship in the future";
    case "prefer_not_to_answer":
      return "Prefer not to answer";
    default:
      return "";
  }
}

function getShortAnswerLabel(value: string): string {
  switch (value) {
    case "yes":
      return "Yes";
    case "no":
      return "No";
    case "open":
      return "Open to discussing";
    case "prefer_not_to_answer":
      return "Prefer not to answer";
    default:
      return "";
  }
}

function getGenderLabel(value: string): string {
  switch (value) {
    case "female":
      return "Female";
    case "male":
      return "Male";
    case "non_binary":
      return "Non-binary";
    case "self_describe":
      return "Self-describe";
    case "prefer_not_to_answer":
      return "Prefer not to answer";
    default:
      return "";
  }
}

function getVeteranLabel(value: string): string {
  switch (value) {
    case "protected_veteran":
      return "Protected veteran";
    case "not_protected_veteran":
      return "Not a protected veteran";
    case "not_veteran":
      return "Not a veteran";
    case "prefer_not_to_answer":
      return "Prefer not to answer";
    default:
      return "";
  }
}

function splitFullName(fullName: string): {
  firstName: string;
  lastName: string;
} {
  const nameParts = fullName.trim().split(/\s+/).filter(Boolean);

  return {
    firstName: nameParts[0] ?? "",
    lastName: nameParts.slice(1).join(" "),
  };
}

function getPhoneCountryCode(phone: string): string {
  const match = phone.match(/^\s*\+(\d{1,3})/);

  if (match) {
    return `+${match[1]}`;
  }

  return "+1";
}

function buildApplicationVariables(
  profile: ProfileRow,
  job: JobRow,
): Record<string, string> {
  const nameParts = splitFullName(profile.full_name);

  return {
    firstName: nameParts.firstName,
    lastName: nameParts.lastName,
    fullName: profile.full_name,
    email: profile.email,
    phone: profile.phone,
    phoneCountryCode: getPhoneCountryCode(profile.phone),
    location: profile.location,
    targetRole: profile.job_title,
    experienceLevel: profile.experience_level,
    yearsExperience: String(profile.years_experience),
    skills: profile.skills.join(", "),
    remotePreference: profile.remote_preference,
    linkedinUrl: profile.linkedin_url,
    portfolioUrl: profile.portfolio_url,
    workExperience: profile.resume_work_experience,
    projects: profile.resume_projects,
    education: profile.resume_education,
    achievements: profile.resume_achievements,
    workAuthorization: getWorkAuthorizationLabel(profile.work_authorization),
    sponsorshipRequirement: getSponsorshipLabel(
      profile.sponsorship_requirement,
    ),
    salaryExpectation: profile.salary_expectation,
    startAvailability: profile.start_availability,
    relocationPreference: getShortAnswerLabel(profile.relocation_preference),
    backgroundCheckConsent: getShortAnswerLabel(
      profile.background_check_consent,
    ),
    genderIdentity: getGenderLabel(profile.gender_identity),
    hispanicLatinoIdentity: getShortAnswerLabel(
      profile.hispanic_latino_identity,
    ),
    veteranStatus: getVeteranLabel(profile.veteran_status),
    disabilityStatus: getShortAnswerLabel(profile.disability_status),
    applicationNotes: profile.application_notes,
    resumePdfUrl: profile.resume_pdf_url,
    jobTitle: job.title,
    company: job.company,
    jobLocation: job.location,
    matchReason: job.match_reason,
    coverLetter: job.cover_letter,
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
    console.error("[agent/apply/log]", result.error);
  }
}

async function loadProfile(
  input: ApplyQueuedJobsInput,
): Promise<ProfileRow | null> {
  const insforge = createInsforgeServer(input.accessToken);
  const result = await insforge.database
    .from("profiles")
    .select(
      "full_name,email,phone,location,job_title,experience_level,years_experience,skills,remote_preference,linkedin_url,portfolio_url,resume_work_experience,resume_projects,resume_education,resume_achievements,work_authorization,sponsorship_requirement,salary_expectation,start_availability,relocation_preference,background_check_consent,gender_identity,hispanic_latino_identity,veteran_status,disability_status,application_notes,resume_pdf_url,linkedin_context_id,linkedin_connected",
    )
    .eq("id", input.userId)
    .maybeSingle();

  if (result.error) {
    console.error("[agent/apply/loadProfile]", result.error);
    return null;
  }

  if (!isProfileRow(result.data)) {
    return null;
  }

  const data = result.data as Record<string, unknown>;

  return {
    ...result.data,
    linkedin_context_id:
      typeof data.linkedin_context_id === "string"
        ? data.linkedin_context_id
        : undefined,
    linkedin_connected:
      typeof data.linkedin_connected === "boolean"
        ? data.linkedin_connected
        : false,
  };
}

async function loadRun(input: ApplyQueuedJobsInput): Promise<RunRow> {
  const insforge = createInsforgeServer(input.accessToken);
  const result = await insforge.database
    .from("agent_runs")
    .select("jobs_failed")
    .eq("id", input.runId)
    .eq("user_id", input.userId)
    .maybeSingle();

  if (result.error) {
    console.error("[agent/apply/loadRun]", result.error);
  }

  return isRunRow(result.data) ? result.data : { jobs_failed: 0 };
}

async function loadQueuedJobs(input: ApplyQueuedJobsInput): Promise<JobRow[]> {
  const insforge = createInsforgeServer(input.accessToken);
  const result = await insforge.database
    .from("jobs")
    .select(
      "id,title,company,location,external_apply_url,description,match_score,match_reason,cover_letter",
    )
    .eq("run_id", input.runId)
    .eq("user_id", input.userId)
    .eq("status", "queued");

  if (result.error) {
    console.error("[agent/apply/loadQueuedJobs]", result.error);
    return [];
  }

  return Array.isArray(result.data)
    ? result.data
        .map(normalizeJobRow)
        .filter((job: JobRow | null): job is JobRow => job !== null)
    : [];
}

async function loadJob(input: {
  accessToken: string;
  runId: string;
  userId: string;
  jobId: string;
}): Promise<JobRow | null> {
  const insforge = createInsforgeServer(input.accessToken);
  const result = await insforge.database
    .from("jobs")
    .select(
      "id,title,company,location,external_apply_url,description,match_score,match_reason,cover_letter,status",
    )
    .eq("id", input.jobId)
    .eq("run_id", input.runId)
    .eq("user_id", input.userId)
    .maybeSingle();

  if (result.error) {
    console.error("[agent/apply/loadJob]", result.error);
    return null;
  }

  return normalizeJobRow(result.data);
}

async function loadManualJob(input: {
  accessToken: string;
  userId: string;
  jobId: string;
}): Promise<JobRow | null> {
  const insforge = createInsforgeServer(input.accessToken);
  const result = await insforge.database
    .from("jobs")
    .select(
      "id,run_id,title,company,location,linkedin_url,external_apply_url,description,match_score,match_reason,cover_letter,status,resume_url,is_tailored",
    )
    .eq("id", input.jobId)
    .eq("user_id", input.userId)
    .maybeSingle();

  if (result.error) {
    console.error("[agent/apply/loadManualJob]", result.error);
    return null;
  }

  return normalizeJobRow(result.data);
}

async function updateRunStatus(input: {
  accessToken: string;
  runId: string;
  status: "applying" | "completed" | "failed";
  appliedJobs?: number;
  failedJobs?: number;
}): Promise<void> {
  const updateData =
    input.status === "completed"
      ? {
          status: input.status,
          jobs_applied: input.appliedJobs ?? 0,
          jobs_failed: input.failedJobs ?? 0,
          completed_at: new Date().toISOString(),
        }
      : {
          status: input.status,
          completed_at:
            input.status === "failed" ? new Date().toISOString() : undefined,
        };
  const insforge = createInsforgeServer(input.accessToken);
  const result = await insforge.database
    .from("agent_runs")
    .update(updateData)
    .eq("id", input.runId);

  if (result.error) {
    console.error("[agent/apply/updateRunStatus]", result.error);
  }
}

async function updateJobStatus(input: {
  accessToken: string;
  jobId: string;
  status: "applying" | "applied" | "failed";
  errorMessage?: string;
  resumeUrl?: string;
}): Promise<void> {
  const updateData =
    input.status === "applied"
      ? {
          status: input.status,
          resume_url: input.resumeUrl,
          error_message: null,
          applied_at: new Date().toISOString(),
        }
      : {
          status: input.status,
          error_message: input.errorMessage ?? null,
        };
  const insforge = createInsforgeServer(input.accessToken);
  const result = await insforge.database
    .from("jobs")
    .update(updateData)
    .eq("id", input.jobId);

  if (result.error) {
    console.error("[agent/apply/updateJobStatus]", result.error);
  }
}

async function runAct(input: {
  session: StagehandSession;
  instruction: string;
  variables?: Record<string, string>;
}): Promise<boolean> {
  try {
    const result = await input.session.stagehand.act(input.instruction, {
      variables: input.variables,
      timeout: 45_000,
    });

    return result.success;
  } catch (error) {
    console.error("[agent/apply/act]", error);
    return false;
  }
}

async function createResumeTempFile(input: {
  accessToken: string;
  resumePath: string;
}): Promise<string | null> {
  const insforge = createInsforgeServer(input.accessToken);
  const downloadResult = await insforge.storage
    .from("resumes")
    .download(input.resumePath);

  if (downloadResult.error || !downloadResult.data) {
    console.error("[agent/apply/downloadResume]", downloadResult.error);
    return null;
  }

  const arrayBuffer = await downloadResult.data.arrayBuffer();
  const filePath = join(tmpdir(), `jobpilot-resume-${randomUUID()}.pdf`);
  await writeFile(filePath, Buffer.from(arrayBuffer));

  return filePath;
}

async function cleanupResumeTempFile(filePath: string | null): Promise<void> {
  if (!filePath) {
    return;
  }

  try {
    await unlink(filePath);
  } catch (error) {
    console.error("[agent/apply/cleanupResume]", error);
  }
}

async function tryAttachResume(input: {
  session: StagehandSession;
  resumeFilePath: string | null;
}): Promise<boolean> {
  if (!input.resumeFilePath) {
    return false;
  }

  try {
    const uploadActions = await input.session.stagehand.observe(
      "Find the resume, CV, or file upload control for attaching an applicant resume.",
    );
    const uploadAction = uploadActions.find((action) =>
      action.description.toLowerCase().includes("resume"),
    );
    const selector = uploadAction?.selector;

    if (!selector) {
      return false;
    }

    const page = input.session.stagehand.context.pages()[0];

    if (!page) {
      return false;
    }

    await page.locator(selector).setInputFiles(input.resumeFilePath);
    return true;
  } catch (error) {
    console.error("[agent/apply/attachResume]", error);
    return false;
  }
}

async function submitApplication(input: {
  session: StagehandSession;
  variables: Record<string, string>;
}): Promise<boolean> {
  const filled = await runAct({
    session: input.session,
    instruction:
      "Fill the job application form using the applicant variables. Use {{fullName}}, {{email}}, {{phone}}, {{location}}, {{linkedinUrl}}, {{portfolioUrl}}, {{skills}}, {{yearsExperience}}, {{workExperience}}, {{projects}}, {{education}}, {{achievements}}, {{workAuthorization}}, {{sponsorshipRequirement}}, {{salaryExpectation}}, {{startAvailability}}, {{relocationPreference}}, {{backgroundCheckConsent}}, {{genderIdentity}}, {{hispanicLatinoIdentity}}, {{veteranStatus}}, {{disabilityStatus}}, and {{applicationNotes}} where relevant. For legal, sponsorship, salary, demographic, veteran, disability, relocation, background check, and authorization questions, answer only from the matching saved variable; Prefer not to answer is a valid truthful answer when the form offers a similar option. Leave account creation, assessment, security-clearance, or unavailable questions unchanged if the correct truthful answer is not available.",
    variables: input.variables,
  });

  if (!filled) {
    return false;
  }

  await runAct({
    session: input.session,
    instruction:
      "If there is a cover letter or additional message field, fill it with {{coverLetter}}.",
    variables: input.variables,
  });

  const submitted = await runAct({
    session: input.session,
    instruction:
      "Submit the application only if required fields are complete and legal/personal disclosure fields were answered from the saved applicant variables. Do not submit if the page asks for a login, paid account, assessment, security clearance, or a required answer that is unavailable from the saved variables.",
    variables: input.variables,
  });

  if (!submitted) {
    return false;
  }

  try {
    const confirmation = await input.session.stagehand.extract(
      "Determine whether the application has been submitted or received.",
      submissionSchema,
    );

    return confirmation.submitted;
  } catch (error) {
    console.error("[agent/apply/extractSubmission]", error);
    return true;
  }
}

async function extractExternalApplyReview(input: {
  session: StagehandSession;
  variables: Record<string, string>;
}): Promise<ExternalApplyReview | null> {
  try {
    return await input.session.stagehand.extract(
      [
        "Review the current external application page after the automation attempt.",
        "Report which visible fields contain applicant data, which required fields remain empty, and which fields appear misfilled.",
        `Applicant name is "${input.variables.fullName}", email is "${input.variables.email}", phone is "${input.variables.phone}".`,
        "Treat email-looking values in name fields, phone-looking values in unrelated fields, literal %placeholders%, duplicated values, and values placed in the wrong field as possibleMisfilledFields.",
        "Do not mark canSubmit true if a required field is empty, a value appears in the wrong field, a resume upload is missing, or the page asks for an unavailable secret/API-derived answer.",
      ].join("\n"),
      externalApplyReviewSchema,
    );
  } catch (error) {
    console.error("[agent/apply/external-review]", error);
    return null;
  }
}

async function submitExternalApplicationWithAgent(input: {
  session: StagehandSession;
  variables: Record<string, string>;
}): Promise<{
  submitted: boolean;
  review?: ExternalApplyReview;
  error?: string;
}> {
  const agent = input.session.stagehand.agent({
    mode: "hybrid",
    model: EXTERNAL_APPLY_AGENT_MODEL,
  });
  const result = await agent.execute({
    maxSteps: 40,
    toolTimeout: 45_000,
    variables: input.variables,
    instruction: [
      "Fill every field in this job application form and then submit it.",
      "",
      "CANDIDATE DATA — use these exact values, one variable per field:",
      "First Name field → %firstName%",
      "Last Name field → %lastName%",
      "Full Name field (if combined) → %fullName%",
      "Email field → %email%",
      "Phone field → %phone%",
      "Location / City field → %location%",
      "LinkedIn URL field → %linkedinUrl%",
      "Portfolio / Website field → %portfolioUrl%",
      "Current Title / Role field → %targetRole%",
      "Years of Experience field → %yearsExperience%",
      "Skills field → %skills%",
      "Work Authorization field → %workAuthorization%",
      "Sponsorship field → %sponsorshipRequirement%",
      "Salary Expectation field → %salaryExpectation%",
      "Start Date / Availability field → %startAvailability%",
      "Relocation field → %relocationPreference%",
      "",
      "For open-ended questions about motivation, experience, projects, opinions, or craft:",
      "Write a concise professional answer drawing from:",
      "  Work experience: %workExperience%",
      "  Projects: %projects%",
      "  Education: %education%",
      "  Achievements: %achievements%",
      "  Extra context: %applicationNotes%",
      "",
      "For resume or CV upload: attach the file at %resumePdfUrl%.",
      "",
      "Fill every field you can from the variables above, including free-text motivation and essay questions.",
      "For 'How did you hear about this role' use 'LinkedIn'.",
      "",
      "Only skip a field and note it as a blocker if it falls into one of these hard stops:",
      "- A field requiring an external secret, code, or API call not in the variables",
      "- A mandatory CAPTCHA or account creation wall that prevents continuing",
      "",
      "Fill ALL other fields including demographic, veteran, disability, salary, and sponsorship using the matching variables.",
      "Prefer not to answer is a valid option for optional disclosure fields when the variable value indicates it.",
      "",
      "After filling every fillable field, attempt to submit. If a hard-stop blocker field is still empty and required, call done with taskComplete=false and describe the exact blocker.",
    ].join("\n"),
  });

  if (result.success) {
    return { submitted: true };
  }

  const review = await extractExternalApplyReview(input);

  return {
    submitted: false,
    review: review ?? undefined,
    error:
      review?.blockers.join("; ") ||
      review?.summary ||
      result.message ||
      "Could not complete the application. Check the Browserbase recording for details.",
  };
}

const easyApplyResultSchema = z.object({
  applied: z
    .boolean()
    .describe("True only when the LinkedIn application was submitted."),
  needsReview: z
    .boolean()
    .describe(
      "True only when a required unanswered question needs human judgment.",
    ),
  reason: z
    .string()
    .describe("Short final status or the exact blocker requiring review."),
});

async function applyEasyApplyJob(input: {
  accessToken: string;
  userId: string;
  runId: string;
  profile: ProfileRow;
  job: JobRow;
  contextId: string;
}): Promise<boolean> {
  const stepPrefix = `apply-${input.job.id}: `;

  await updateJobStatus({
    accessToken: input.accessToken,
    jobId: input.job.id,
    status: "applying",
  });

  await logAgentMessage({
    accessToken: input.accessToken,
    runId: input.runId,
    userId: input.userId,
    level: "info",
    message: `${stepPrefix}Opening LinkedIn Easy Apply session for ${input.job.title} at ${input.job.company}.`,
    jobId: input.job.id,
  });

  let session: StagehandSession | null = null;

  try {
    session = await createStagehandSession({
      timeout: 600,
      contextId: input.contextId,
      persistContext: true,
      metadata: {
        feature: "easy-apply",
        runId: input.runId,
        jobId: input.job.id,
        stepId: `apply-${input.job.id}`,
        company: input.job.company,
      },
    });

    await saveBrowserbaseRecording({
      accessToken: input.accessToken,
      runId: input.runId,
      userId: input.userId,
      sessionId: session.browserbaseSession.id,
      recordingUrl: session.browserbaseSession.recordingUrl,
    });

    const page = session.stagehand.context.pages()[0];

    if (!page) {
      throw new Error("Stagehand did not initialize an active page.");
    }

    await page.goto(input.job.linkedin_url, {
      waitUntil: "domcontentloaded",
      timeoutMs: 60_000,
    });

    const variables = buildApplicationVariables(input.profile, input.job);
    const agent = session.stagehand.agent({
      mode: "dom",
      model: EXTERNAL_APPLY_AGENT_MODEL,
      executionModel: EXTERNAL_APPLY_AGENT_MODEL,
    });

    await agent.execute({
      page,
      maxSteps: 18,
      toolTimeout: 25_000,
      variables,
      instruction:
        "Apply to this LinkedIn job using LinkedIn Easy Apply. Click the Easy Apply button, then work only inside the LinkedIn Easy Apply modal. Use the already selected LinkedIn resume. Complete every step you can with the applicant variables. Use %fullName% for name, %email% for Email address, %phoneCountryCode% for phone country code, %phone% for phone number, %location% for location, %linkedinUrl% for LinkedIn URL, %portfolioUrl% for portfolio URL, %targetRole% for target role, %experienceLevel% for experience level, %yearsExperience% for years of experience, %skills% for skills, %workExperience% for work history, %projects% for projects, %education% for education, %achievements% for achievements, %workAuthorization% for work authorization, %sponsorshipRequirement% for sponsorship, %salaryExpectation% for salary, %startAvailability% for start date or notice period, %relocationPreference% for relocation, %backgroundCheckConsent% for background check, %genderIdentity% for gender, %hispanicLatinoIdentity% for Hispanic/Latino, %veteranStatus% for veteran status, %disabilityStatus% for disability, and %applicationNotes% for recurring application context. For ordinary required job-fit questions, infer the best truthful answer from the profile variables instead of stopping. For yes/no questions about skills, tools, frameworks, role responsibilities, remote preference, or experience, answer from %skills%, %workExperience%, %projects%, %education%, %achievements%, %targetRole%, %experienceLevel%, %remotePreference%, and %yearsExperience%. If the modal asks a required numeric question like 'How many years of work experience do you have with X?', answer with %yearsExperience% unless a more specific numeric answer is visible in the profile variables. For legal/personal disclosure questions, answer only from the matching saved variable; Prefer not to answer is a valid truthful answer when the form offers a similar option. Stop without submitting if a required legal, sponsorship, salary, demographic, veteran, disability, background check, security-clearance, assessment, or other truth-sensitive answer is unavailable. For short free-text questions about relevant experience, summarize the strongest matching evidence from work experience, projects, skills, education, and achievements. Click Next, Review, and finally Submit application when all required fields on the current step are complete. Never click Save. Never click Follow. Never click a non-Easy-Apply external Apply button. Optional unanswered fields should not block submission.",
    });

    const output = await session.stagehand.extract(
      "Inspect the current LinkedIn Easy Apply state. applied is true only if the application was submitted or a submitted confirmation is visible. needsReview is true only if a required unanswered question remains that needs human judgment or unavailable legal/personal disclosure. reason should be a short final status or exact blocker.",
      easyApplyResultSchema,
    );

    await closeStagehandSession(session);

    if (output.applied) {
      await updateJobStatus({
        accessToken: input.accessToken,
        jobId: input.job.id,
        status: "applied",
      });
      await logAgentMessage({
        accessToken: input.accessToken,
        runId: input.runId,
        userId: input.userId,
        level: "success",
        message: `${stepPrefix}Submitted ${input.job.title} at ${input.job.company} via LinkedIn Easy Apply.`,
        jobId: input.job.id,
      });

      return true;
    }

    const errorMessage = output.needsReview
      ? `Needs review: ${output.reason}`
      : output.reason || "Easy Apply agent did not submit.";

    await updateJobStatus({
      accessToken: input.accessToken,
      jobId: input.job.id,
      status: "failed",
      errorMessage,
    });
    await logAgentMessage({
      accessToken: input.accessToken,
      runId: input.runId,
      userId: input.userId,
      level: "error",
      message: `${stepPrefix}Easy Apply did not submit ${input.job.title} at ${input.job.company}. ${errorMessage}`,
      jobId: input.job.id,
    });

    return false;
  } catch (error) {
    console.error("[agent/apply/easyApply]", error);

    if (session) {
      await session.stagehand.close({ force: true });
    }

    await updateJobStatus({
      accessToken: input.accessToken,
      jobId: input.job.id,
      status: "failed",
      errorMessage: "Easy Apply automation failed.",
    });
    await logAgentMessage({
      accessToken: input.accessToken,
      runId: input.runId,
      userId: input.userId,
      level: "error",
      message: `${stepPrefix}Easy Apply automation failed for ${input.job.title} at ${input.job.company}.`,
      jobId: input.job.id,
    });

    return false;
  }
}

async function applyToJob(input: {
  accessToken: string;
  userId: string;
  runId: string;
  profile: ProfileRow;
  job: JobRow;
  resumePath: string;
  resumeUrl: string;
  mode: "auto" | "manual";
  stepId?: string;
}): Promise<boolean> {
  const stepPrefix = input.stepId ? `${input.stepId}: ` : "";

  if (!input.job.cover_letter.trim()) {
    await updateJobStatus({
      accessToken: input.accessToken,
      jobId: input.job.id,
      status: "failed",
      errorMessage: "Cover letter is missing.",
    });
    await logAgentMessage({
      accessToken: input.accessToken,
      runId: input.runId,
      userId: input.userId,
      level: "error",
      message: `${stepPrefix}Could not apply to ${input.job.title} at ${input.job.company}: cover letter is missing.`,
      jobId: input.job.id,
    });
    return false;
  }

  await updateJobStatus({
    accessToken: input.accessToken,
    jobId: input.job.id,
    status: "applying",
  });

  await logAgentMessage({
    accessToken: input.accessToken,
    runId: input.runId,
    userId: input.userId,
    level: "info",
    message: `${stepPrefix}Opening a fresh Browserbase session for ${input.job.title} at ${input.job.company}.`,
    jobId: input.job.id,
  });

  let resumeFilePath: string | null = null;
  let session: StagehandSession | null = null;

  try {
    resumeFilePath = await createResumeTempFile({
      accessToken: input.accessToken,
      resumePath: input.resumePath,
    });

    if (!resumeFilePath && input.mode === "manual") {
      throw new Error("Could not download the tailored resume.");
    }

    session = await createStagehandSession({
      timeout: input.mode === "manual" ? 600 : 120,
      experimental: input.mode === "manual",
      metadata: {
        feature: input.mode === "manual" ? "manual-apply" : "apply-agent",
        runId: input.runId,
        jobId: input.job.id,
        stepId: input.stepId ?? `apply-${input.job.id}`,
        company: input.job.company,
      },
    });
    await saveBrowserbaseRecording({
      accessToken: input.accessToken,
      runId: input.runId,
      userId: input.userId,
      sessionId: session.browserbaseSession.id,
      recordingUrl: session.browserbaseSession.recordingUrl,
    });

    const page = session.stagehand.context.pages()[0];

    if (!page) {
      throw new Error("Stagehand did not initialize an active page.");
    }

    await page.goto(input.job.external_apply_url, {
      waitUntil: "domcontentloaded",
      timeoutMs: 60_000,
    });

    const variables = buildApplicationVariables(input.profile, input.job);

    // For manual mode use the actual resume URL (tailored or base) so the agent
    // can upload it directly — same approach as the linkedin-test external apply.
    if (input.mode === "manual" && input.resumeUrl) {
      variables.resumePdfUrl = input.resumeUrl;
    }

    const resumeAttached =
      input.mode !== "manual" &&
      (await tryAttachResume({
        session,
        resumeFilePath,
      }));

    if (resumeAttached) {
      await logAgentMessage({
        accessToken: input.accessToken,
        runId: input.runId,
        userId: input.userId,
        level: "info",
        message: `${stepPrefix}Attached the ${
          input.mode === "manual" ? "tailored" : "generated"
        } resume for ${input.job.title} at ${input.job.company}.`,
        jobId: input.job.id,
      });
    }

    const submission =
      input.mode === "manual"
        ? await submitExternalApplicationWithAgent({
            session,
            variables,
          })
        : {
            submitted: await submitApplication({
              session,
              variables,
            }),
          };

    await closeStagehandSession(session);
    await cleanupResumeTempFile(resumeFilePath);

    if (!submission.submitted) {
      await updateJobStatus({
        accessToken: input.accessToken,
        jobId: input.job.id,
        status: "failed",
        errorMessage:
          submission.error ?? "Could not submit the application form.",
      });
      await logAgentMessage({
        accessToken: input.accessToken,
        runId: input.runId,
        userId: input.userId,
        level: "error",
        message:
          `${stepPrefix}Could not submit ${input.job.title} at ${input.job.company}. ${
            submission.error ?? ""
          }`.trim(),
        jobId: input.job.id,
      });
      return false;
    }

    await updateJobStatus({
      accessToken: input.accessToken,
      jobId: input.job.id,
      status: "applied",
      resumeUrl: input.resumeUrl,
    });
    await logAgentMessage({
      accessToken: input.accessToken,
      runId: input.runId,
      userId: input.userId,
      level: "success",
      message: `${stepPrefix}Submitted ${input.job.title} at ${input.job.company}.`,
      jobId: input.job.id,
    });

    return true;
  } catch (error) {
    console.error("[agent/apply/job]", error);

    if (session) {
      await session.stagehand.close({ force: true });
    }

    await cleanupResumeTempFile(resumeFilePath);
    await updateJobStatus({
      accessToken: input.accessToken,
      jobId: input.job.id,
      status: "failed",
      errorMessage: "Application submission failed.",
    });
    await logAgentMessage({
      accessToken: input.accessToken,
      runId: input.runId,
      userId: input.userId,
      level: "error",
      message: `${stepPrefix}Application failed for ${input.job.title} at ${input.job.company}.`,
      jobId: input.job.id,
    });

    return false;
  }
}

export async function beginApplyToQueuedJobs(
  input: ApplyQueuedJobsInput,
): Promise<BeginApplyQueuedJobsResult> {
  await updateRunStatus({
    accessToken: input.accessToken,
    runId: input.runId,
    status: "applying",
  });
  await logAgentMessage({
    accessToken: input.accessToken,
    runId: input.runId,
    userId: input.userId,
    level: "info",
    message: "Starting auto-apply for queued jobs.",
  });

  const profile = await loadProfile(input);

  if (!profile) {
    await updateRunStatus({
      accessToken: input.accessToken,
      runId: input.runId,
      status: "failed",
    });
    await logAgentMessage({
      accessToken: input.accessToken,
      runId: input.runId,
      userId: input.userId,
      level: "error",
      message: "Could not load the saved profile for auto-apply.",
    });

    return {
      success: false,
      error: "Could not load the saved profile for auto-apply.",
    };
  }

  const run = await loadRun(input);
  const jobs = await loadQueuedJobs(input);

  if (jobs.length === 0) {
    await updateRunStatus({
      accessToken: input.accessToken,
      runId: input.runId,
      status: "completed",
      appliedJobs: 0,
      failedJobs: run.jobs_failed,
    });
    await logAgentMessage({
      accessToken: input.accessToken,
      runId: input.runId,
      userId: input.userId,
      level: "warning",
      message: "No queued jobs were available for auto-apply.",
    });

    return {
      success: true,
      data: {
        jobs: [],
        previousFailedJobs: run.jobs_failed,
      },
    };
  }

  return {
    success: true,
    data: {
      jobs: jobs.map((job) => ({
        id: job.id,
        title: job.title,
        company: job.company,
      })),
      previousFailedJobs: run.jobs_failed,
    },
  };
}

export async function completeApplyToQueuedJobs(input: {
  accessToken: string;
  runId: string;
  userId: string;
  appliedJobs: number;
  failedJobs: number;
  previousFailedJobs: number;
}): Promise<void> {
  await updateRunStatus({
    accessToken: input.accessToken,
    runId: input.runId,
    status: "completed",
    appliedJobs: input.appliedJobs,
    failedJobs: input.previousFailedJobs + input.failedJobs,
  });
  await logAgentMessage({
    accessToken: input.accessToken,
    runId: input.runId,
    userId: input.userId,
    level: "success",
    message: `Auto-apply finished with ${input.appliedJobs} submitted applications and ${input.failedJobs} failures.`,
  });
}

export async function failApplyToQueuedJobs(
  input: ApplyQueuedJobsInput,
): Promise<void> {
  await updateRunStatus({
    accessToken: input.accessToken,
    runId: input.runId,
    status: "failed",
  });
  await logAgentMessage({
    accessToken: input.accessToken,
    runId: input.runId,
    userId: input.userId,
    level: "error",
    message: "Auto-apply failed.",
  });
}

export async function applySingleQueuedJob(
  input: ApplySingleQueuedJobInput,
): Promise<ApplySingleQueuedJobResult> {
  try {
    const profile = await loadProfile(input);

    if (!profile) {
      return {
        success: false,
        error: "Could not load the saved profile for auto-apply.",
      };
    }

    const job = await loadJob(input);

    if (!job) {
      return {
        success: false,
        error: "Could not load the queued job for auto-apply.",
      };
    }

    if (job.status === "applied") {
      await logAgentMessage({
        accessToken: input.accessToken,
        runId: input.runId,
        userId: input.userId,
        level: "info",
        message: `${input.stepId}: ${job.title} at ${job.company} was already applied.`,
        jobId: job.id,
      });

      return {
        success: true,
        data: {
          applied: true,
        },
      };
    }

    if (job.status !== "queued" && job.status !== "applying") {
      return {
        success: true,
        data: {
          applied: false,
        },
      };
    }

    const applied = await applyToJob({
      accessToken: input.accessToken,
      userId: input.userId,
      runId: input.runId,
      profile,
      job,
      resumePath: `resumes/${input.userId}/resume.pdf`,
      resumeUrl: profile.resume_pdf_url,
      mode: "auto",
      stepId: input.stepId,
    });

    return {
      success: true,
      data: {
        applied,
      },
    };
  } catch (error) {
    console.error("[agent/apply/single]", error);

    return {
      success: false,
      error: "Could not apply to the queued job.",
    };
  }
}

export async function applyManualJob(
  input: ApplyManualJobInput,
): Promise<ApplyManualJobResult> {
  try {
    const profile = await loadProfile({
      accessToken: input.accessToken,
      userId: input.userId,
      runId: "",
    });

    if (!profile) {
      return {
        success: false,
        error: "Could not load your saved profile.",
      };
    }

    const job = await loadManualJob(input);

    if (!job || !job.run_id) {
      return {
        success: false,
        error: "Could not load this job.",
      };
    }

    const manualRunId = job.run_id;

    if (job.status === "applied") {
      return {
        success: false,
        error: "This job has already been applied to.",
      };
    }

    if (job.status !== "found" && job.status !== "failed") {
      return {
        success: false,
        error: "This job is not ready for manual apply.",
      };
    }

    // --- Easy Apply path ---
    if (job.is_easy_apply) {
      const contextId = profile.linkedin_context_id;
      const isConnected = profile.linkedin_connected;

      if (!contextId || !isConnected) {
        return {
          success: false,
          error:
            "Connect LinkedIn on your profile before using LinkedIn Easy Apply.",
        };
      }

      const applied = await applyEasyApplyJob({
        accessToken: input.accessToken,
        userId: input.userId,
        runId: manualRunId,
        profile,
        job,
        contextId,
      });

      return {
        success: true,
        data: { applied },
      };
    }

    // --- External apply path ---
    if (!job.external_apply_url.trim()) {
      return {
        success: false,
        error: "This job does not have an external company apply URL.",
      };
    }

    const resumeUrl =
      job.is_tailored === true && job.resume_url?.trim()
        ? job.resume_url
        : profile.resume_pdf_url;
    const resumePath =
      job.is_tailored === true && job.resume_url?.trim()
        ? `resumes/${input.userId}/${job.id}.pdf`
        : `resumes/${input.userId}/resume.pdf`;

    if (!resumeUrl.trim()) {
      return {
        success: false,
        error: "Generate your base resume before running the apply attempt.",
      };
    }

    let manualJob = job;

    if (!manualJob.cover_letter.trim()) {
      const coverLetterResult = await generateCoverLetterForJob({
        accessToken: input.accessToken,
        userId: input.userId,
        runId: manualRunId,
        jobId: manualJob.id,
      });

      if (!coverLetterResult.success || !coverLetterResult.data) {
        await updateJobStatus({
          accessToken: input.accessToken,
          jobId: manualJob.id,
          status: "failed",
          errorMessage: "Could not generate a cover letter.",
        });

        return {
          success: false,
          error:
            coverLetterResult.error ?? "Could not generate a cover letter.",
        };
      }

      manualJob = {
        ...manualJob,
        cover_letter: coverLetterResult.data.coverLetter,
      };
    }

    const applied = await applyToJob({
      accessToken: input.accessToken,
      userId: input.userId,
      runId: manualRunId,
      profile,
      job: manualJob,
      resumePath,
      resumeUrl,
      mode: "manual",
      stepId: `apply-${manualJob.id}`,
    });

    return {
      success: true,
      data: {
        applied,
      },
    };
  } catch (error) {
    console.error("[agent/apply/manual]", error);

    return {
      success: false,
      error: "Could not apply to this job.",
    };
  }
}

export async function applyToQueuedJobs(
  input: ApplyQueuedJobsInput,
): Promise<ApplyQueuedJobsResult> {
  try {
    await updateRunStatus({
      accessToken: input.accessToken,
      runId: input.runId,
      status: "applying",
    });
    await logAgentMessage({
      accessToken: input.accessToken,
      runId: input.runId,
      userId: input.userId,
      level: "info",
      message: "Starting auto-apply for queued jobs.",
    });

    const profile = await loadProfile(input);

    if (!profile) {
      await updateRunStatus({
        accessToken: input.accessToken,
        runId: input.runId,
        status: "failed",
      });
      await logAgentMessage({
        accessToken: input.accessToken,
        runId: input.runId,
        userId: input.userId,
        level: "error",
        message: "Could not load the saved profile for auto-apply.",
      });

      return {
        success: false,
        error: "Could not load the saved profile for auto-apply.",
      };
    }

    const run = await loadRun(input);
    const jobs = await loadQueuedJobs(input);

    if (jobs.length === 0) {
      await updateRunStatus({
        accessToken: input.accessToken,
        runId: input.runId,
        status: "completed",
        appliedJobs: 0,
        failedJobs: run.jobs_failed,
      });
      await logAgentMessage({
        accessToken: input.accessToken,
        runId: input.runId,
        userId: input.userId,
        level: "warning",
        message: "No queued jobs were available for auto-apply.",
      });

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

    for (const job of jobs) {
      const applied = await applyToJob({
        accessToken: input.accessToken,
        userId: input.userId,
        runId: input.runId,
        profile,
        job,
        resumePath: `resumes/${input.userId}/resume.pdf`,
        resumeUrl: profile.resume_pdf_url,
        mode: "auto",
      });

      if (applied) {
        appliedJobs += 1;
      } else {
        failedJobs += 1;
      }
    }

    await updateRunStatus({
      accessToken: input.accessToken,
      runId: input.runId,
      status: "completed",
      appliedJobs,
      failedJobs: run.jobs_failed + failedJobs,
    });
    await logAgentMessage({
      accessToken: input.accessToken,
      runId: input.runId,
      userId: input.userId,
      level: "success",
      message: `Auto-apply finished with ${appliedJobs} submitted applications and ${failedJobs} failures.`,
    });

    return {
      success: true,
      data: {
        appliedJobs,
        failedJobs,
      },
    };
  } catch (error) {
    console.error("[agent/apply]", error);
    await updateRunStatus({
      accessToken: input.accessToken,
      runId: input.runId,
      status: "failed",
    });
    await logAgentMessage({
      accessToken: input.accessToken,
      runId: input.runId,
      userId: input.userId,
      level: "error",
      message: "Auto-apply failed.",
    });

    return {
      success: false,
      error: "Auto-apply failed.",
    };
  }
}
