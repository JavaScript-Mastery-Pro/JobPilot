import "server-only";

import { z } from "zod";

import { createInsforgeServer } from "@/lib/insforge-server";
import { closeStagehandSession, createStagehandSession } from "@/lib/stagehand";

const DEFAULT_JOB_LIMIT = 10;

type LinkedInDiscoveryInput = {
  accessToken: string;
  userId: string;
  runId: string;
  jobTitle: string;
  location: string;
  limit?: number;
};

type LinkedInDiscoveryResult = {
  success: boolean;
  data?: {
    savedJobs: number;
    skippedJobs: number;
    recordingUrl: string;
  };
  error?: string;
};

type AgentLogLevel = "info" | "success" | "warning" | "error";

type ProfileRow = {
  linkedin_context_id?: unknown;
  linkedin_connected?: unknown;
};

type LinkedInJob = {
  title: string;
  company: string;
  location: string;
  linkedInUrl: string;
  externalApplyUrl: string;
  isEasyApply: boolean;
};

type DomLinkedInJob = {
  title: string;
  company: string;
  location: string;
  linkedInUrl: string;
};

type ApplyModeDetails = {
  externalApplyUrl: string;
  isEasyApply: boolean;
};

const linkedInJobsSchema = z.object({
  jobs: z.array(
    z.object({
      title: z.string().describe("The job title."),
      company: z.string().describe("The company hiring for the role."),
      location: z.string().describe("The listed job location."),
      linkedInUrl: z
        .string()
        .describe("The absolute LinkedIn URL for this job posting."),
      externalApplyUrl: z
        .string()
        .describe(
          "The external company or ATS apply URL if visible, otherwise an empty string.",
        ),
      isEasyApply: z
        .boolean()
        .describe("Whether this listing appears to be LinkedIn Easy Apply."),
    }),
  ),
});

function getStringValue(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function buildLinkedInSearchUrl(jobTitle: string, location: string): string {
  const params = new URLSearchParams({
    keywords: jobTitle,
    location,
  });

  return `https://www.linkedin.com/jobs/search/?${params.toString()}`;
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

function normalizeExternalApplyUrl(value: string): string {
  const normalizedUrl = normalizeUrl(value);

  if (!normalizedUrl) {
    return "";
  }

  try {
    const url = new URL(normalizedUrl);

    if (!url.hostname.toLowerCase().includes("linkedin.")) {
      return url.toString();
    }

    const redirectedUrl =
      url.searchParams.get("url") ??
      url.searchParams.get("redirectUrl") ??
      url.searchParams.get("externalUrl") ??
      url.searchParams.get("applyUrl") ??
      "";

    return normalizeExternalApplyUrl(redirectedUrl);
  } catch {
    return "";
  }
}

function buildLinkedInJobUrl(value: string): string {
  const jobId = value.trim();

  return /^\d{6,}$/.test(jobId)
    ? `https://www.linkedin.com/jobs/view/${jobId}/`
    : "";
}

function normalizeLinkedInJobUrl(value: string): string {
  const normalizedUrl = normalizeUrl(value);

  if (!normalizedUrl) {
    return "";
  }

  try {
    const url = new URL(normalizedUrl);

    if (!url.hostname.toLowerCase().includes("linkedin.")) {
      return "";
    }

    const viewMatch = url.pathname.match(/\/jobs\/view\/(\d+)/);
    const currentJobId = url.searchParams.get("currentJobId") ?? "";
    const jobId = viewMatch?.[1] ?? currentJobId;

    return buildLinkedInJobUrl(jobId);
  } catch {
    return "";
  }
}

function normalizeJob(job: LinkedInJob): LinkedInJob {
  return {
    title: job.title.trim(),
    company: job.company.trim(),
    location: job.location.trim(),
    linkedInUrl:
      normalizeLinkedInJobUrl(job.linkedInUrl) ||
      buildLinkedInJobUrl(job.linkedInUrl),
    externalApplyUrl: normalizeExternalApplyUrl(job.externalApplyUrl),
    isEasyApply: job.isEasyApply,
  };
}

function normalizeDomJob(job: DomLinkedInJob): LinkedInJob {
  return {
    title: job.title.trim(),
    company: job.company.trim(),
    location: job.location.trim(),
    linkedInUrl: normalizeLinkedInJobUrl(job.linkedInUrl),
    externalApplyUrl: "",
    isEasyApply: false,
  };
}

function getJobKey(job: LinkedInJob): string {
  return [job.title, job.company, job.location]
    .map((part: string) => part.toLowerCase().replace(/\s+/g, " ").trim())
    .join("|");
}

function mergeJobs(input: {
  domJobs: LinkedInJob[];
  extractedJobs: LinkedInJob[];
  limit: number;
}): LinkedInJob[] {
  const jobsByKey = new Map<string, LinkedInJob>();

  for (const domJob of input.domJobs) {
    if (domJob.title && domJob.company && domJob.linkedInUrl) {
      jobsByKey.set(getJobKey(domJob), domJob);
    }
  }

  for (const extractedJob of input.extractedJobs) {
    if (!extractedJob.title || !extractedJob.company) {
      continue;
    }

    const key = getJobKey(extractedJob);
    const existingJob = jobsByKey.get(key);

    jobsByKey.set(key, {
      title: extractedJob.title || existingJob?.title || "",
      company: extractedJob.company || existingJob?.company || "",
      location: extractedJob.location || existingJob?.location || "",
      linkedInUrl: existingJob?.linkedInUrl || extractedJob.linkedInUrl,
      externalApplyUrl:
        extractedJob.externalApplyUrl || existingJob?.externalApplyUrl || "",
      isEasyApply:
        extractedJob.isEasyApply || existingJob?.isEasyApply || false,
    });
  }

  return Array.from(jobsByKey.values())
    .filter((job: LinkedInJob) => job.title && job.company)
    .slice(0, input.limit);
}

function getProfileContextId(data: unknown): string {
  const row = data as ProfileRow | null;

  if (!row || typeof row !== "object") {
    return "";
  }

  const isConnected =
    typeof row.linkedin_connected === "boolean"
      ? row.linkedin_connected
      : false;

  if (!isConnected) {
    return "";
  }

  return getStringValue(row.linkedin_context_id);
}

function getJobId(row: unknown): string | null {
  if (row === null || typeof row !== "object") {
    return null;
  }

  return "id" in row && typeof row.id === "string" ? row.id : null;
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
    console.error("[agent/linkedin/log]", result.error);
  }
}

async function updateRunCounts(input: {
  accessToken: string;
  runId: string;
  status: string;
  jobsFound: number;
}): Promise<void> {
  const insforge = createInsforgeServer(input.accessToken);
  const values =
    input.status === "completed" || input.status === "failed"
      ? {
          status: input.status,
          jobs_found: input.jobsFound,
          completed_at: new Date().toISOString(),
        }
      : {
          status: input.status,
          jobs_found: input.jobsFound,
        };
  const result = await insforge.database
    .from("agent_runs")
    .update(values)
    .eq("id", input.runId);

  if (result.error) {
    console.error("[agent/linkedin/updateRunCounts]", result.error);
  }
}

async function saveDiscoveredJob(input: {
  accessToken: string;
  runId: string;
  userId: string;
  job: LinkedInJob;
}): Promise<string | null> {
  const insforge = createInsforgeServer(input.accessToken);
  const descriptionParts = [
    input.job.title,
    input.job.company,
    input.job.location,
    input.job.isEasyApply ? "LinkedIn Easy Apply" : "External link apply",
  ].filter(Boolean);
  const result = await insforge.database
    .from("jobs")
    .insert({
      run_id: input.runId,
      user_id: input.userId,
      title: input.job.title,
      company: input.job.company,
      location: input.job.location,
      linkedin_url: input.job.linkedInUrl,
      external_apply_url: input.job.externalApplyUrl,
      description: descriptionParts.join("\n"),
      status: "found",
      is_tailored: false,
    })
    .select();

  if (result.error) {
    console.error("[agent/linkedin/saveDiscoveredJob]", result.error);
    return null;
  }

  return Array.isArray(result.data) ? getJobId(result.data[0]) : null;
}

async function extractDomLinkedInJobs(page: {
  evaluate: <T>(pageFunction: () => T | Promise<T>) => Promise<T>;
}): Promise<LinkedInJob[]> {
  try {
    const jobs = await page.evaluate<DomLinkedInJob[]>(() => {
      function cleanText(value: string | null | undefined): string {
        return (value ?? "").replace(/\s+/g, " ").trim();
      }

      function getAbsoluteUrl(value: string | null): string {
        if (!value) {
          return "";
        }

        try {
          return new URL(value, window.location.origin).toString();
        } catch {
          return "";
        }
      }

      const anchors = Array.from(
        document.querySelectorAll<HTMLAnchorElement>(
          'a[href*="/jobs/view/"], a[href*="/jobs/collections/"], a[href*="currentJobId="]',
        ),
      );
      const cards = Array.from(
        document.querySelectorAll<HTMLElement>(
          "[data-job-id], [data-occludable-job-id], .job-card-container, li.jobs-search-results__list-item",
        ),
      );
      const seen = new Set<string>();

      function getJobIdFromUrl(value: string): string {
        try {
          const url = new URL(value, window.location.origin);
          const currentJobId = url.searchParams.get("currentJobId");
          const viewMatch = url.pathname.match(/\/jobs\/view\/(\d+)/);
          const jobId = viewMatch?.[1] ?? currentJobId ?? "";

          return /^\d{6,}$/.test(jobId) ? jobId : "";
        } catch {
          return "";
        }
      }

      function getJobIdFromElement(element: Element | null): string {
        let currentElement = element;

        while (currentElement) {
          const htmlElement = currentElement as HTMLElement;
          const jobId =
            htmlElement.dataset.jobId ??
            htmlElement.dataset.occludableJobId ??
            htmlElement.getAttribute("data-job-id") ??
            htmlElement.getAttribute("data-occludable-job-id") ??
            "";

          if (/^\d{6,}$/.test(jobId)) {
            return jobId;
          }

          currentElement = currentElement.parentElement;
        }

        return "";
      }

      function buildJobUrl(jobId: string): string {
        const normalizedJobId = jobId.trim();

        return /^\d{6,}$/.test(normalizedJobId)
          ? `https://www.linkedin.com/jobs/view/${normalizedJobId}/`
          : "";
      }

      function getLinkedInUrl(input: {
        anchor?: HTMLAnchorElement;
        card?: Element | null;
      }): string {
        const href = input.anchor?.getAttribute("href") ?? "";
        const absoluteHref = getAbsoluteUrl(href);
        const jobId =
          getJobIdFromUrl(absoluteHref) ||
          getJobIdFromElement(input.anchor ?? input.card ?? null);

        return buildJobUrl(jobId);
      }

      function getJobFromCard(input: {
        anchor?: HTMLAnchorElement;
        card: Element | null;
      }): DomLinkedInJob | null {
        const linkedInUrl = getLinkedInUrl(input);

        if (!linkedInUrl || seen.has(linkedInUrl)) {
          return null;
        }

        seen.add(linkedInUrl);

        const card =
          input.card ??
          input.anchor?.closest("li") ??
          input.anchor?.closest("[data-job-id]") ??
          input.anchor?.closest("[data-occludable-job-id]") ??
          input.anchor?.closest(".job-card-container") ??
          input.anchor?.parentElement ??
          null;
        const cardText = cleanText(card?.textContent);
        const anchorText = cleanText(input.anchor?.textContent);
        const lines = cardText
          .split(/(?<=\S)\s{2,}|[\n\r]+/)
          .map(cleanText)
          .filter(Boolean);
        const title = anchorText || lines[0] || "";
        const company = lines.find((line: string) => line !== title) ?? "";
        const location =
          lines.find((line: string) => {
            const lowerLine = line.toLowerCase();
            return (
              line !== title &&
              line !== company &&
              (lowerLine.includes("remote") ||
                lowerLine.includes("hybrid") ||
                lowerLine.includes(",") ||
                lowerLine.includes("united") ||
                lowerLine.includes("india") ||
                lowerLine.includes("bangladesh"))
            );
          }) ?? "";

        return {
          title,
          company,
          location,
          linkedInUrl,
        };
      }

      const anchorJobs = anchors
        .map((anchor: HTMLAnchorElement) =>
          getJobFromCard({
            anchor,
            card:
              anchor.closest("li") ??
              anchor.closest("[data-job-id]") ??
              anchor.closest("[data-occludable-job-id]") ??
              anchor.closest(".job-card-container"),
          }),
        )
        .filter((job: DomLinkedInJob | null): job is DomLinkedInJob => {
          return Boolean(job?.title && job.linkedInUrl);
        });
      const cardJobs = cards
        .map((card: HTMLElement) =>
          getJobFromCard({
            anchor:
              card.querySelector<HTMLAnchorElement>(
                'a[href*="/jobs/view/"], a[href*="/jobs/collections/"], a[href*="currentJobId="]',
              ) ?? undefined,
            card,
          }),
        )
        .filter((job: DomLinkedInJob | null): job is DomLinkedInJob => {
          return Boolean(job?.title && job.linkedInUrl);
        });

      return [...anchorJobs, ...cardJobs].slice(0, 10);
    });

    return jobs.map(normalizeDomJob).filter((job: LinkedInJob) => {
      return Boolean(job.title && job.linkedInUrl);
    });
  } catch (error) {
    console.error("[agent/linkedin/dom]", error);
    return [];
  }
}

async function detectApplyModeOnDetailPage(input: {
  page: {
    goto: (
      url: string,
      options: { waitUntil: "domcontentloaded"; timeoutMs: number },
    ) => Promise<unknown>;
    evaluate: <T>(pageFunction: () => T | Promise<T>) => Promise<T>;
    url: () => string;
    waitForTimeout: (ms: number) => Promise<void>;
  };
  linkedInUrl: string;
}): Promise<ApplyModeDetails> {
  try {
    await input.page.goto(input.linkedInUrl, {
      waitUntil: "domcontentloaded",
      timeoutMs: 45_000,
    });

    const details = await input.page.evaluate<ApplyModeDetails>(() => {
      function cleanText(value: string | null | undefined): string {
        return (value ?? "").replace(/\s+/g, " ").trim();
      }

      function getAbsoluteUrl(value: string | null): string {
        if (!value) {
          return "";
        }

        try {
          return new URL(value, window.location.origin).toString();
        } catch {
          return "";
        }
      }

      function getExternalApplyUrl(value: string): string {
        const absoluteUrl = getAbsoluteUrl(value);

        if (!absoluteUrl) {
          return "";
        }

        try {
          const url = new URL(absoluteUrl);

          if (!url.hostname.toLowerCase().includes("linkedin.")) {
            return url.toString();
          }

          const redirectedUrl =
            url.searchParams.get("url") ||
            url.searchParams.get("redirectUrl") ||
            url.searchParams.get("externalUrl") ||
            url.searchParams.get("applyUrl") ||
            "";

          return getExternalApplyUrl(redirectedUrl);
        } catch {
          return "";
        }
      }

      function isEasyApplyControl(
        control: HTMLAnchorElement | HTMLButtonElement,
      ): boolean {
        const text = cleanText(control.textContent).toLowerCase();
        const ariaLabel = cleanText(
          control.getAttribute("aria-label"),
        ).toLowerCase();

        return text.includes("easy apply") || ariaLabel.includes("easy apply");
      }

      function isApplyControl(
        control: HTMLAnchorElement | HTMLButtonElement,
      ): boolean {
        const text = cleanText(control.textContent).toLowerCase();
        const ariaLabel = cleanText(
          control.getAttribute("aria-label"),
        ).toLowerCase();
        const combined = `${text} ${ariaLabel}`;

        return (
          !isEasyApplyControl(control) &&
          combined.includes("apply") &&
          !combined.includes("save")
        );
      }

      const controls = Array.from(
        document.querySelectorAll<HTMLAnchorElement | HTMLButtonElement>(
          "a, button",
        ),
      );
      const easyApplyControl = controls.find(isEasyApplyControl);

      if (easyApplyControl) {
        return {
          externalApplyUrl: "",
          isEasyApply: true,
        };
      }

      const externalApplyAnchor = controls.find((control) => {
        if (!(control instanceof HTMLAnchorElement)) {
          return false;
        }

        return (
          Boolean(getExternalApplyUrl(control.getAttribute("href") ?? "")) &&
          isApplyControl(control)
        );
      }) as HTMLAnchorElement | undefined;

      return {
        externalApplyUrl: getExternalApplyUrl(
          externalApplyAnchor?.getAttribute("href") ?? "",
        ),
        isEasyApply: false,
      };
    });

    if (details.isEasyApply || details.externalApplyUrl) {
      return details;
    }

    await input.page.evaluate(() => {
      function cleanText(value: string | null | undefined): string {
        return (value ?? "").replace(/\s+/g, " ").trim().toLowerCase();
      }

      const controls = Array.from(
        document.querySelectorAll<HTMLAnchorElement | HTMLButtonElement>(
          "a, button",
        ),
      );
      const applyControl = controls.find((control) => {
        const text = cleanText(control.textContent);
        const ariaLabel = cleanText(control.getAttribute("aria-label"));
        const combined = `${text} ${ariaLabel}`;
        const disabled =
          control instanceof HTMLButtonElement
            ? control.disabled ||
              control.getAttribute("aria-disabled") === "true"
            : control.getAttribute("aria-disabled") === "true";

        return (
          !disabled &&
          combined.includes("apply") &&
          !combined.includes("easy apply") &&
          !combined.includes("save")
        );
      });

      applyControl?.click();
    });
    await input.page.waitForTimeout(3_000);

    try {
      const redirectedUrl = new URL(input.page.url());

      if (!redirectedUrl.hostname.toLowerCase().includes("linkedin.")) {
        return {
          externalApplyUrl: redirectedUrl.toString(),
          isEasyApply: false,
        };
      }
    } catch {
      return details;
    }

    return details;
  } catch (error) {
    console.error("[agent/linkedin/applyMode]", error);
    return {
      externalApplyUrl: "",
      isEasyApply: false,
    };
  }
}

async function enrichJobsWithDetailApplyModes(input: {
  page: {
    goto: (
      url: string,
      options: { waitUntil: "domcontentloaded"; timeoutMs: number },
    ) => Promise<unknown>;
    evaluate: <T>(pageFunction: () => T | Promise<T>) => Promise<T>;
    url: () => string;
    waitForTimeout: (ms: number) => Promise<void>;
  };
  jobs: LinkedInJob[];
}): Promise<LinkedInJob[]> {
  const enrichedJobs: LinkedInJob[] = [];

  for (const job of input.jobs) {
    if (!job.linkedInUrl) {
      enrichedJobs.push(job);
      continue;
    }

    const applyMode = await detectApplyModeOnDetailPage({
      page: input.page,
      linkedInUrl: job.linkedInUrl,
    });

    enrichedJobs.push({
      ...job,
      externalApplyUrl: applyMode.externalApplyUrl || job.externalApplyUrl,
      isEasyApply: applyMode.isEasyApply || job.isEasyApply,
    });
  }

  return enrichedJobs;
}

export async function discoverLinkedInJobs(
  input: LinkedInDiscoveryInput,
): Promise<LinkedInDiscoveryResult> {
  const limit = input.limit ?? DEFAULT_JOB_LIMIT;
  const insforge = createInsforgeServer(input.accessToken);
  const profileResult = await insforge.database
    .from("profiles")
    .select("linkedin_context_id,linkedin_connected")
    .eq("id", input.userId)
    .maybeSingle();

  if (profileResult.error) {
    console.error("[agent/linkedin/profile]", profileResult.error);
    return {
      success: false,
      error: "Could not load your LinkedIn context.",
    };
  }

  const contextId = getProfileContextId(profileResult.data);

  if (!contextId) {
    return {
      success: false,
      error: "Connect LinkedIn before finding jobs.",
    };
  }

  await logAgentMessage({
    accessToken: input.accessToken,
    runId: input.runId,
    userId: input.userId,
    level: "info",
    message: `Searching LinkedIn for ${input.jobTitle} roles in ${input.location}.`,
  });

  const session = await createStagehandSession({
    timeout: 600,
    contextId,
    persistContext: true,
    metadata: {
      feature: "jobs",
      purpose: "linkedin-job-search",
      runId: input.runId,
      userId: input.userId,
    },
  });

  try {
    await updateRunCounts({
      accessToken: input.accessToken,
      runId: input.runId,
      status: "finding",
      jobsFound: 0,
    });

    const page = session.stagehand.context.pages()[0];

    if (!page) {
      throw new Error("Stagehand did not initialize an active page.");
    }

    await page.goto(buildLinkedInSearchUrl(input.jobTitle, input.location), {
      waitUntil: "domcontentloaded",
      timeoutMs: 60_000,
    });

    const currentUrl = page.url();

    if (currentUrl.includes("login") || currentUrl.includes("authwall")) {
      await session.stagehand.close({ force: true });
      return {
        success: false,
        error: "LinkedIn session expired. Reconnect before finding jobs.",
      };
    }

    const domJobs = await extractDomLinkedInJobs(page);
    const extracted = await session.stagehand.extract(
      "Find up to 10 visible LinkedIn job listings on this page. For each listing, return the job title, company, location, absolute LinkedIn job URL, whether it appears to be Easy Apply, and any visible external company or ATS apply URL. If no external apply URL is visible, return an empty string. Do not invent URLs.",
      linkedInJobsSchema,
    );
    const extractedJobs = extracted.jobs
      .map(normalizeJob)
      .filter((job: LinkedInJob) => job.title && job.company)
      .slice(0, limit);
    const mergedJobs = mergeJobs({
      domJobs,
      extractedJobs,
      limit,
    });
    const jobs = await enrichJobsWithDetailApplyModes({
      page,
      jobs: mergedJobs,
    });
    let savedJobs = 0;
    let skippedJobs = 0;

    for (const job of jobs) {
      const savedJobId = await saveDiscoveredJob({
        accessToken: input.accessToken,
        runId: input.runId,
        userId: input.userId,
        job,
      });

      if (!savedJobId) {
        skippedJobs += 1;
        continue;
      }

      savedJobs += 1;
      await logAgentMessage({
        accessToken: input.accessToken,
        runId: input.runId,
        userId: input.userId,
        level: "success",
        message: `Saved ${job.title} at ${job.company} from LinkedIn.`,
        jobId: savedJobId,
      });
    }

    await closeStagehandSession(session);
    await updateRunCounts({
      accessToken: input.accessToken,
      runId: input.runId,
      status: "completed",
      jobsFound: savedJobs,
    });

    return {
      success: true,
      data: {
        savedJobs,
        skippedJobs,
        recordingUrl: session.browserbaseSession.recordingUrl,
      },
    };
  } catch (error) {
    console.error("[agent/linkedin]", error);
    await updateRunCounts({
      accessToken: input.accessToken,
      runId: input.runId,
      status: "failed",
      jobsFound: 0,
    });
    await session.stagehand.close({ force: true });

    return {
      success: false,
      error: "Could not find LinkedIn jobs.",
    };
  }
}
