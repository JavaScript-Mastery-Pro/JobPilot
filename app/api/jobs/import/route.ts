import "server-only";

import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { z } from "zod";

import { getAccessToken, getCurrentUser } from "@/lib/auth";
import { createInsforgeServer } from "@/lib/insforge-server";
import { closeStagehandSession, createStagehandSession } from "@/lib/stagehand";
import { MATCH_THRESHOLD } from "@/lib/utils";

type ApiResponse =
  | {
      success: true;
      data: {
        jobId: string;
        title: string;
        company: string;
        matchScore: number;
        matchReason: string;
      };
    }
  | {
      success: false;
      error: string;
    };

type RequestBody = {
  url?: unknown;
};

type ExtractedJob = {
  title: string;
  company: string;
  location: string;
  description: string;
  externalApplyUrl: string;
};

type PageSnapshot = {
  title: string;
  metaDescription: string;
  headings: string[];
  jobDescriptionText: string;
  bodyText: string;
  applyLinks: PageLink[];
  jobLikeLinks: PageLink[];
};

type PageLink = {
  text: string;
  href: string;
};

type StagehandJobExtraction = ExtractedJob & {
  isJobPosting: boolean;
  confidence: number;
  pageType: string;
};

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
  linkedin_context_id?: unknown;
  linkedin_connected?: unknown;
};

type MatchResponse = {
  score: number;
  reason: string;
};

type CleanDescriptionResponse = {
  title: string | null;
  company: string | null;
  location: string | null;
  salary: string | null;
  jobType: string | null;
  aboutRole: string | null;
  responsibilities: string[] | null;
  requirements: string[] | null;
  niceToHave: string[] | null;
  benefits: string[] | null;
  aboutCompany: string | null;
};

type JobInsertRow = {
  id?: unknown;
};

type AgentRunRow = {
  id?: unknown;
};

class ImportJobPageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImportJobPageError";
  }
}

const jobPageSchema = z.object({
  isJobPosting: z
    .boolean()
    .describe("True only if this is a specific job detail page."),
  confidence: z
    .number()
    .describe("Confidence from 0 to 100 that this is a specific job detail."),
  pageType: z
    .string()
    .describe(
      "The kind of page: job_detail, job_list, login_required, company_page, article, unrelated, or unknown.",
    ),
  title: z.string().describe("The job title."),
  company: z.string().describe("The company name hiring for this role."),
  location: z
    .string()
    .describe("The job location (city, state, remote, etc.)."),
  description: z
    .string()
    .describe(
      "The visible job description text. Prefer exact page wording over summarizing.",
    ),
  externalApplyUrl: z
    .string()
    .describe(
      "The direct apply URL for this job if visible on this page, otherwise an empty string.",
    ),
});

function jsonResponse(body: ApiResponse, status: number): NextResponse {
  return NextResponse.json(body, { status });
}

function isRequestBody(value: unknown): value is RequestBody {
  return value !== null && typeof value === "object";
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

function isMatchResponse(value: unknown): value is MatchResponse {
  if (!isRecord(value)) {
    return false;
  }

  return typeof value.score === "number" && typeof value.reason === "string";
}

function isCleanDescriptionResponse(
  value: unknown,
): value is CleanDescriptionResponse {
  if (!isRecord(value)) {
    return false;
  }

  return "aboutRole" in value || "responsibilities" in value;
}

function getStringValue(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function getNullableStringValue(value: unknown): string | null {
  const stringValue = getStringValue(value);
  return stringValue ? stringValue : null;
}

function getNullableStringArray(value: unknown): string[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const items = value
    .map((item: unknown) => getStringValue(item))
    .filter(Boolean);

  return items.length > 0 ? items : null;
}

function normalizeCleanDescriptionResponse(
  value: CleanDescriptionResponse,
): CleanDescriptionResponse {
  return {
    title: getNullableStringValue(value.title),
    company: getNullableStringValue(value.company),
    location: getNullableStringValue(value.location),
    salary: getNullableStringValue(value.salary),
    jobType: getNullableStringValue(value.jobType),
    aboutRole: getNullableStringValue(value.aboutRole),
    responsibilities: getNullableStringArray(value.responsibilities),
    requirements: getNullableStringArray(value.requirements),
    niceToHave: getNullableStringArray(value.niceToHave),
    benefits: getNullableStringArray(value.benefits),
    aboutCompany: getNullableStringValue(value.aboutCompany),
  };
}

function formatStructuredJobDescription(
  value: CleanDescriptionResponse,
): string {
  const normalized = normalizeCleanDescriptionResponse(value);
  const sections: string[] = [];
  const summaryParts = [
    normalized.title,
    normalized.company,
    normalized.location,
    normalized.jobType,
    normalized.salary,
  ].filter(Boolean);

  if (summaryParts.length > 0) {
    sections.push(summaryParts.join(" · "));
  }

  if (normalized.aboutCompany) {
    sections.push(`About company\n${normalized.aboutCompany}`);
  }

  if (normalized.aboutRole) {
    sections.push(`About role\n${normalized.aboutRole}`);
  }

  const listSections: Array<{ title: string; items: string[] | null }> = [
    { title: "Responsibilities", items: normalized.responsibilities },
    { title: "Requirements", items: normalized.requirements },
    { title: "Nice to have", items: normalized.niceToHave },
    { title: "Benefits", items: normalized.benefits },
  ];

  for (const section of listSections) {
    if (section.items && section.items.length > 0) {
      sections.push(
        `${section.title}\n${section.items
          .map((item: string) => `- ${item}`)
          .join("\n")}`,
      );
    }
  }

  return cleanDescription(sections.join("\n\n")).slice(0, 10_000);
}

function isLinkedInUrl(value: string): boolean {
  try {
    return new URL(value).hostname.toLowerCase().includes("linkedin.");
  } catch {
    return false;
  }
}

function getLinkedInContextId(profile: ProfileRow): string {
  const isConnected =
    typeof profile.linkedin_connected === "boolean"
      ? profile.linkedin_connected
      : false;

  if (!isConnected) {
    return "";
  }

  return getStringValue(profile.linkedin_context_id);
}

function getNumberValue(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function getInsertedJobId(data: unknown): string {
  if (!Array.isArray(data)) {
    return "";
  }

  const row = data[0] as JobInsertRow | undefined;

  if (!row || !isRecord(row)) {
    return "";
  }

  return typeof row.id === "string" ? row.id : "";
}

function getInsertedRunId(data: unknown): string {
  if (!Array.isArray(data)) {
    return "";
  }

  const row = data[0] as AgentRunRow | undefined;

  if (!row || !isRecord(row)) {
    return "";
  }

  return typeof row.id === "string" ? row.id : "";
}

function getOpenAIClient(): OpenAI {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("Missing OPENAI_API_KEY.");
  }

  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

async function parseRequestBody(
  request: NextRequest,
): Promise<RequestBody | null> {
  try {
    const body: unknown = await request.json();
    return isRequestBody(body) ? body : null;
  } catch {
    return null;
  }
}

function normalizeUrl(value: string): string {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return "";
  }

  try {
    return new URL(trimmedValue).toString();
  } catch {
    return "";
  }
}

function cleanDescription(value: string): string {
  return value
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function pruneScrapedDescription(value: string): string {
  const stopPatterns = [
    /\bUse AI to assess how you fit\b/i,
    /\bGet AI-powered advice on this job\b/i,
    /\bJob search smarter with Premium\b/i,
    /\bTry Premium\b/i,
    /\bNeed to hire fast\?\b/i,
    /\bAbout Accessibility\b/i,
    /\bSelect language\b/i,
    /\bLinkedIn Corporation\b/i,
  ];
  let pruned = value;

  for (const pattern of stopPatterns) {
    const match = pruned.search(pattern);

    if (match > 0) {
      pruned = pruned.slice(0, match);
    }
  }

  return cleanDescription(pruned);
}

function getBestDescription(input: {
  snapshot: PageSnapshot;
  validatedDescription: string;
  stagehandDescription: string;
}): string {
  const candidates = [
    input.snapshot.jobDescriptionText,
    input.validatedDescription,
    input.stagehandDescription,
    input.snapshot.bodyText,
  ]
    .map(pruneScrapedDescription)
    .filter((description: string) => description.length >= 80);

  return (candidates[0] ?? "").slice(0, 10_000).trim();
}

function getImportRejectionError(pageType: string): string {
  if (pageType === "login_required") {
    return "This page is hidden behind a sign-in modal or login wall. For LinkedIn jobs, use the LinkedIn job fetch flow with a connected LinkedIn session.";
  }

  if (pageType === "job_list") {
    return "This looks like a job list, not a specific job description page. Paste a direct job posting URL.";
  }

  return "This page does not look like a job description page. Paste a direct job posting URL.";
}

async function dismissBlockingDialogs(page: {
  evaluate: <T>(pageFunction: () => T | Promise<T>) => Promise<T>;
}): Promise<void> {
  try {
    await page.evaluate<void>(() => {
      function cleanText(value: string | null | undefined): string {
        return (value ?? "").replace(/\s+/g, " ").trim().toLowerCase();
      }

      const controls = Array.from(
        document.querySelectorAll<HTMLButtonElement | HTMLAnchorElement>(
          "button, a",
        ),
      );
      const dismissControl = controls.find(
        (control: HTMLButtonElement | HTMLAnchorElement) => {
          const text = cleanText(control.textContent);
          const ariaLabel = cleanText(control.getAttribute("aria-label"));
          const title = cleanText(control.getAttribute("title"));
          const combined = `${text} ${ariaLabel} ${title}`;

          return (
            combined === "x" ||
            combined.includes("close") ||
            combined.includes("dismiss") ||
            combined.includes("not now") ||
            combined.includes("skip")
          );
        },
      );

      dismissControl?.click();
    });
  } catch (error) {
    console.error("[api/jobs/import/dismissDialogs]", error);
  }
}

async function getPageSnapshot(page: {
  evaluate: <T>(pageFunction: () => T | Promise<T>) => Promise<T>;
}): Promise<PageSnapshot> {
  return page.evaluate<PageSnapshot>(() => {
    function cleanText(value: string | null | undefined): string {
      return (value ?? "").replace(/\s+/g, " ").trim();
    }

    function getAbsoluteUrl(value: string | null): string {
      if (!value) {
        return "";
      }

      try {
        return new URL(value, window.location.href).toString();
      } catch {
        return "";
      }
    }

    function getLink(anchor: HTMLAnchorElement): PageLink {
      return {
        text:
          cleanText(anchor.textContent) ||
          cleanText(anchor.getAttribute("aria-label")) ||
          cleanText(anchor.title),
        href: getAbsoluteUrl(anchor.getAttribute("href")),
      };
    }

    const metaDescription = cleanText(
      document
        .querySelector<HTMLMetaElement>('meta[name="description"]')
        ?.getAttribute("content"),
    );
    const headings = Array.from(
      document.querySelectorAll<HTMLHeadingElement>("h1, h2, h3"),
    )
      .map((heading: HTMLHeadingElement) => cleanText(heading.textContent))
      .filter(Boolean)
      .slice(0, 20);
    const descriptionSelectors = [
      '[data-automation-id*="jobPostingDescription"]',
      '[data-testid*="job-description"]',
      '[class*="job-description"]',
      '[class*="jobDescription"]',
      '[id*="job-description"]',
      '[id*="jobDescription"]',
      '[class*="description"]',
      '[id*="description"]',
      "main",
      "article",
    ];
    const jobDescriptionText =
      descriptionSelectors
        .map((selector: string) => {
          const element = document.querySelector<HTMLElement>(selector);
          return cleanText(element?.innerText);
        })
        .find((text: string) => text.length >= 300) ?? "";
    const links = Array.from(document.querySelectorAll<HTMLAnchorElement>("a"))
      .map(getLink)
      .filter((link: PageLink) => link.href);
    const applyLinks = links
      .filter((link: PageLink) => {
        const combined = `${link.text} ${link.href}`.toLowerCase();
        return (
          combined.includes("apply") ||
          combined.includes("application") ||
          combined.includes("greenhouse") ||
          combined.includes("lever") ||
          combined.includes("ashby") ||
          combined.includes("workable")
        );
      })
      .slice(0, 20);
    const jobLikeLinks = links
      .filter((link: PageLink) => {
        const combined = `${link.text} ${link.href}`.toLowerCase();
        return (
          combined.includes("job") ||
          combined.includes("career") ||
          combined.includes("role") ||
          combined.includes("position")
        );
      })
      .slice(0, 20);

    return {
      title: cleanText(document.title),
      metaDescription,
      headings,
      jobDescriptionText: jobDescriptionText.slice(0, 12_000),
      bodyText: cleanText(document.body?.innerText).slice(0, 12_000),
      applyLinks,
      jobLikeLinks,
    };
  });
}

async function extractJobViaBrowser(input: {
  url: string;
  linkedInContextId?: string;
}): Promise<{
  snapshot: PageSnapshot;
  stagehand: StagehandJobExtraction;
}> {
  const session = await createStagehandSession({
    contextId: input.linkedInContextId,
    persistContext: Boolean(input.linkedInContextId),
    metadata: {
      feature: "job-import",
      source: input.linkedInContextId ? "linkedin-context" : "public-url",
    },
  });

  try {
    const page = session.stagehand.context.pages()[0];

    if (!page) {
      throw new Error("Stagehand did not initialize an active page.");
    }

    await page.goto(input.url, {
      waitUntil: "domcontentloaded",
      timeoutMs: 45_000,
    });

    await page.waitForTimeout(2_000);
    await dismissBlockingDialogs(page);
    await page.waitForTimeout(1_000);

    const snapshot = await getPageSnapshot(page);
    const result = await session.stagehand.extract(
      "Inspect the visible page and decide whether it is a specific job detail page, not a job list, login page, company page, article, or unrelated page. Extract the job title, company, location, the visible job description text using page wording, and direct apply URL if visible. Do not invent missing fields.",
      jobPageSchema,
    );

    await closeStagehandSession(session);

    return {
      snapshot,
      stagehand: {
        isJobPosting: result.isJobPosting,
        confidence: result.confidence,
        pageType: result.pageType.trim(),
        title: result.title.trim(),
        company: result.company.trim(),
        location: result.location.trim(),
        description: result.description.trim(),
        externalApplyUrl: result.externalApplyUrl.trim(),
      },
    };
  } catch (error) {
    await session.stagehand.close({ force: true });
    throw error;
  }
}

function validateExtractedJob(input: {
  snapshot: PageSnapshot;
  stagehand: StagehandJobExtraction;
}): ExtractedJob {
  const confidence = Math.min(
    Math.max(Math.round(input.stagehand.confidence), 0),
    100,
  );
  const title = getStringValue(input.stagehand.title);
  const company = getStringValue(input.stagehand.company);
  const bestDescription = getBestDescription({
    snapshot: input.snapshot,
    validatedDescription: "",
    stagehandDescription: input.stagehand.description,
  });
  const pageType = input.stagehand.pageType.toLowerCase();
  const hardRejectedPage =
    pageType === "job_list" ||
    pageType === "company_page" ||
    pageType === "article" ||
    pageType === "unrelated";

  if (!input.stagehand.isJobPosting || confidence < 70 || hardRejectedPage) {
    throw new ImportJobPageError(getImportRejectionError(pageType));
  }

  if (!title || !company || bestDescription.length < 80) {
    throw new ImportJobPageError(
      "This page does not look like a complete job description page. Paste a direct job posting URL.",
    );
  }

  return {
    title,
    company,
    location: getStringValue(input.stagehand.location),
    description: bestDescription,
    externalApplyUrl: normalizeUrl(input.stagehand.externalApplyUrl),
  };
}

async function updateImportRun(input: {
  accessToken: string;
  runId: string;
  status: "completed" | "failed";
  jobsFound: number;
  jobsMatched: number;
  jobsFailed: number;
  jobsInReview: number;
}): Promise<void> {
  const insforge = createInsforgeServer(input.accessToken);
  const result = await insforge.database
    .from("agent_runs")
    .update({
      status: input.status,
      jobs_found: input.jobsFound,
      jobs_matched: input.jobsMatched,
      jobs_applied: 0,
      jobs_failed: input.jobsFailed,
      jobs_in_review: input.jobsInReview,
      completed_at: new Date().toISOString(),
    })
    .eq("id", input.runId);

  if (result.error) {
    console.error("[api/jobs/import/updateRun]", result.error);
  }
}

async function scoreJob(input: {
  openai: OpenAI;
  profile: ProfileRow;
  job: ExtractedJob;
  jobUrl: string;
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
          input: {
            profile: {
              name: input.profile.full_name,
              targetRole: input.profile.job_title,
              location: input.profile.location,
              experienceLevel: input.profile.experience_level,
              yearsExperience: input.profile.years_experience,
              skills: input.profile.skills,
              remotePreference: input.profile.remote_preference,
              evidence: {
                workExperience: input.profile.resume_work_experience,
                projects: input.profile.resume_projects,
                education: input.profile.resume_education,
                achievements: input.profile.resume_achievements,
              },
            },
            job: {
              title: input.job.title,
              company: input.job.company,
              location: input.job.location,
              applyUrl: input.job.externalApplyUrl || input.jobUrl,
              description: input.job.description,
            },
            scoring: {
              strongMatch:
                "Role, seniority, core skills, location or remote preference, and evidence all align.",
              partialMatch:
                "Some requirements align, but seniority, domain, location, or key skills are weak.",
              weakMatch:
                "The role is meaningfully outside the target title, seniority, skills, or location preference.",
            },
          },
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

  if (!isMatchResponse(parsed)) {
    throw new Error("OpenAI returned invalid match content.");
  }

  const rawScore = getNumberValue(parsed.score);
  const reason = getStringValue(parsed.reason);

  return {
    score: Math.min(Math.max(Math.round(rawScore), 0), 100),
    reason: reason || "No reason provided.",
  };
}

async function cleanJobDescription(input: {
  openai: OpenAI;
  title: string;
  company: string;
  location: string;
  rawDescription: string;
}): Promise<string> {
  const fallbackDescription = cleanDescription(input.rawDescription).slice(
    0,
    10_000,
  );
  const prunedFallbackDescription = pruneScrapedDescription(input.rawDescription).slice(
    0,
    10_000,
  );

  if (prunedFallbackDescription.length < 300) {
    return prunedFallbackDescription || fallbackDescription;
  }

  try {
    const response = await input.openai.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      temperature: 0.1,
      max_tokens: 1800,
      messages: [
        {
          role: "system",
          content:
            "You extract structured job information from scraped page text. Return only valid JSON with exactly these keys: title, company, location, salary, jobType, aboutRole, responsibilities, requirements, niceToHave, benefits, aboutCompany. Use null for missing scalar fields and null for missing arrays. Remove navigation, login prompts, ads, premium upsells, footer links, language selectors, unrelated recommendations, and application-click metrics. Do not tailor to the candidate. Do not invent missing details.",
        },
        {
          role: "user",
          content: JSON.stringify({
            task: "From this raw job page text, extract only relevant job information.",
            job: {
              title: input.title,
              company: input.company,
              location: input.location,
            },
            rawText: prunedFallbackDescription,
            outputRules: {
              title: "Exact job title or null.",
              company: "Company name or null.",
              location: "Location or Remote or null.",
              salary: "Salary range or null.",
              jobType: "fulltime, parttime, contract, internship, or null.",
              aboutRole:
                "Two to three concise source-grounded sentences about what the role involves, or null.",
              responsibilities:
                "Array of actual responsibility bullets from the job content, or null.",
              requirements:
                "Array of actual requirement/qualification bullets from the job content, or null.",
              niceToHave:
                "Array of nice-to-have/preferred qualification bullets, or null.",
              benefits:
                "Array of benefits/perks/compensation bullets, or null.",
              aboutCompany:
                "One to two source-grounded sentences about the company, or null.",
            },
          }),
        },
      ],
    });
    const content = response.choices[0]?.message.content;

    if (typeof content !== "string" || !content.trim()) {
      return prunedFallbackDescription;
    }

    const parsed: unknown = JSON.parse(content);

    if (!isCleanDescriptionResponse(parsed)) {
      return prunedFallbackDescription;
    }

    const cleanText = formatStructuredJobDescription(parsed);

    return cleanText.length >= 120
      ? cleanText
      : prunedFallbackDescription;
  } catch (error) {
    console.error("[api/jobs/import/cleanDescription]", error);
    return prunedFallbackDescription;
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  let runId = "";
  let runFinalized = false;

  try {
    const accessToken = await getAccessToken({ persistCookies: true });
    const user = await getCurrentUser({ persistCookies: true });

    if (!user || !accessToken) {
      return jsonResponse(
        { success: false, error: "Sign in again to import a job." },
        401,
      );
    }

    const body = await parseRequestBody(request);

    if (!body) {
      return jsonResponse(
        { success: false, error: "Provide a job URL to import." },
        400,
      );
    }

    const jobUrl = getStringValue(body.url);

    if (!jobUrl) {
      return jsonResponse({ success: false, error: "Enter a job URL." }, 400);
    }

    let parsedUrl: URL;

    try {
      parsedUrl = new URL(jobUrl);
    } catch {
      return jsonResponse(
        { success: false, error: "Enter a valid job URL including https://." },
        400,
      );
    }

    if (parsedUrl.protocol !== "https:" && parsedUrl.protocol !== "http:") {
      return jsonResponse(
        { success: false, error: "Only http and https URLs are supported." },
        400,
      );
    }

    const insforge = createInsforgeServer(accessToken);
    const runResult = await insforge.database
      .from("agent_runs")
      .insert({
        user_id: user.id,
        status: "finding",
        job_title_searched: "Manual job link import",
        location_searched: parsedUrl.hostname,
        jobs_found: 0,
        jobs_matched: 0,
        jobs_applied: 0,
        jobs_failed: 0,
        jobs_in_review: 0,
        started_at: new Date().toISOString(),
      })
      .select("id");

    if (runResult.error) {
      console.error("[api/jobs/import/run]", runResult.error);
      return jsonResponse(
        { success: false, error: "Could not start an import run." },
        500,
      );
    }

    runId = getInsertedRunId(runResult.data);

    if (!runId) {
      return jsonResponse(
        { success: false, error: "Could not start an import run." },
        500,
      );
    }

    const profileResult = await insforge.database
      .from("profiles")
      .select(
        "full_name,location,job_title,experience_level,years_experience,skills,remote_preference,resume_work_experience,resume_projects,resume_education,resume_achievements,linkedin_context_id,linkedin_connected",
      )
      .eq("id", user.id)
      .maybeSingle();

    if (profileResult.error) {
      console.error("[api/jobs/import/profile]", profileResult.error);
      await updateImportRun({
        accessToken,
        runId,
        status: "failed",
        jobsFound: 0,
        jobsMatched: 0,
        jobsFailed: 1,
        jobsInReview: 0,
      });
      runFinalized = true;
      return jsonResponse(
        {
          success: false,
          error: "Could not load your profile. Try again.",
        },
        500,
      );
    }

    if (!isProfileRow(profileResult.data)) {
      await updateImportRun({
        accessToken,
        runId,
        status: "failed",
        jobsFound: 0,
        jobsMatched: 0,
        jobsFailed: 1,
        jobsInReview: 0,
      });
      runFinalized = true;
      return jsonResponse(
        {
          success: false,
          error:
            "Complete your profile before importing jobs so we can match you accurately.",
        },
        400,
      );
    }

    const profile = profileResult.data;

    const openai = getOpenAIClient();
    let extracted: ExtractedJob;

    try {
      const linkedInContextId = isLinkedInUrl(jobUrl)
        ? getLinkedInContextId(profile)
        : "";

      if (isLinkedInUrl(jobUrl) && !linkedInContextId) {
        throw new ImportJobPageError(
          "Connect LinkedIn on your profile before importing LinkedIn job URLs.",
        );
      }

      const browserExtraction = await extractJobViaBrowser({
        url: jobUrl,
        linkedInContextId,
      });
      extracted = validateExtractedJob({
        snapshot: browserExtraction.snapshot,
        stagehand: browserExtraction.stagehand,
      });
      extracted = {
        ...extracted,
        description: await cleanJobDescription({
          openai,
          title: extracted.title,
          company: extracted.company,
          location: extracted.location,
          rawDescription: extracted.description,
        }),
      };
    } catch (extractError) {
      console.error("[api/jobs/import/extract]", extractError);
      await updateImportRun({
        accessToken,
        runId,
        status: "failed",
        jobsFound: 0,
        jobsMatched: 0,
        jobsFailed: 1,
        jobsInReview: 0,
      });
      runFinalized = true;
      return jsonResponse(
        {
          success: false,
          error:
            extractError instanceof ImportJobPageError
              ? extractError.message
              : "Could not open the job page. Check the URL and try again.",
        },
        422,
      );
    }

    if (!extracted.title || !extracted.company) {
      await updateImportRun({
        accessToken,
        runId,
        status: "failed",
        jobsFound: 0,
        jobsMatched: 0,
        jobsFailed: 1,
        jobsInReview: 0,
      });
      runFinalized = true;
      return jsonResponse(
        {
          success: false,
          error:
            "This page does not appear to contain a job posting. Paste a direct job listing URL.",
        },
        422,
      );
    }

    let match: MatchResponse;

    try {
      match = await scoreJob({ openai, profile, job: extracted, jobUrl });
    } catch (matchError) {
      console.error("[api/jobs/import/match]", matchError);
      await updateImportRun({
        accessToken,
        runId,
        status: "failed",
        jobsFound: 0,
        jobsMatched: 0,
        jobsFailed: 1,
        jobsInReview: 0,
      });
      runFinalized = true;
      return jsonResponse(
        { success: false, error: "Could not score the job. Try again." },
        500,
      );
    }

    const jobStatus = "found";

    const insertResult = await insforge.database
      .from("jobs")
      .insert({
        run_id: runId,
        user_id: user.id,
        title: extracted.title,
        company: extracted.company,
        location: extracted.location,
        external_apply_url: extracted.externalApplyUrl || jobUrl,
        description: extracted.description,
        match_score: match.score,
        match_reason: match.reason,
        status: jobStatus,
        is_tailored: false,
      })
      .select("id");

    if (insertResult.error) {
      console.error("[api/jobs/import/insert]", insertResult.error);
      await updateImportRun({
        accessToken,
        runId,
        status: "failed",
        jobsFound: 0,
        jobsMatched: 0,
        jobsFailed: 1,
        jobsInReview: 0,
      });
      runFinalized = true;
      return jsonResponse(
        { success: false, error: "Could not save the job. Try again." },
        500,
      );
    }

    const jobId = getInsertedJobId(insertResult.data);

    if (!jobId) {
      await updateImportRun({
        accessToken,
        runId,
        status: "failed",
        jobsFound: 0,
        jobsMatched: 0,
        jobsFailed: 1,
        jobsInReview: 0,
      });
      runFinalized = true;
      return jsonResponse(
        {
          success: false,
          error: "Job was saved but the ID could not be read.",
        },
        500,
      );
    }

    await updateImportRun({
      accessToken,
      runId,
      status: "completed",
      jobsFound: 1,
      jobsMatched: match.score >= MATCH_THRESHOLD ? 1 : 0,
      jobsFailed: 0,
      jobsInReview: match.score >= MATCH_THRESHOLD ? 0 : 1,
    });
    runFinalized = true;

    return jsonResponse(
      {
        success: true,
        data: {
          jobId,
          title: extracted.title,
          company: extracted.company,
          matchScore: match.score,
          matchReason: match.reason,
        },
      },
      201,
    );
  } catch (error) {
    console.error("[api/jobs/import]", error);

    if (runId && !runFinalized) {
      const accessToken = await getAccessToken({ persistCookies: true });

      if (accessToken) {
        await updateImportRun({
          accessToken,
          runId,
          status: "failed",
          jobsFound: 0,
          jobsMatched: 0,
          jobsFailed: 1,
          jobsInReview: 0,
        });
      }
    }

    return jsonResponse(
      { success: false, error: "An unexpected error occurred. Try again." },
      500,
    );
  }
}
