import { notFound } from "next/navigation";

import { JobDetails } from "@/components/jobs/JobDetails";
import { getAccessToken, requireCurrentUser } from "@/lib/auth";
import { createInsforgeServer } from "@/lib/insforge-server";
import type { JobDetails as JobDetailsType } from "@/types";

type JobDetailsLoadResult =
  | {
      success: true;
      job: JobDetailsType;
    }
  | {
      success: false;
      error: string;
    };

type JobDetailsRow = {
  id?: unknown;
  title?: unknown;
  company?: unknown;
  location?: unknown;
  linkedin_url?: unknown;
  external_apply_url?: unknown;
  description?: unknown;
  match_score?: unknown;
  match_reason?: unknown;
  status?: unknown;
  cover_letter?: unknown;
  resume_url?: unknown;
  is_tailored?: unknown;
  found_at?: unknown;
  applied_at?: unknown;
  error_message?: unknown;
};

type ProfileResumeRow = {
  resume_pdf_url?: unknown;
  linkedin_connected?: unknown;
};

function getStringValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function getBooleanValue(value: unknown): boolean {
  return typeof value === "boolean" ? value : false;
}

function getMatchScore(value: unknown): number {
  return Number.isInteger(value) && typeof value === "number" ? value : 0;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isJobDetailsRow(value: unknown): value is JobDetailsRow {
  return isObject(value);
}

function isProfileResumeRow(value: unknown): value is ProfileResumeRow {
  return isObject(value);
}

function getFirstJobRow(data: unknown): JobDetailsRow | null {
  if (Array.isArray(data) && data.length > 0 && isJobDetailsRow(data[0])) {
    return data[0];
  }

  if (isJobDetailsRow(data)) {
    return data;
  }

  return null;
}

function getFirstProfileRow(data: unknown): ProfileResumeRow | null {
  if (Array.isArray(data) && data.length > 0 && isProfileResumeRow(data[0])) {
    return data[0];
  }

  if (isProfileResumeRow(data)) {
    return data;
  }

  return null;
}

function normalizeJobDetails(
  row: JobDetailsRow,
  hasBaseResume: boolean,
  linkedinConnected: boolean,
): JobDetailsType | null {
  const id = getStringValue(row.id);
  const title = getStringValue(row.title);
  const company = getStringValue(row.company);

  if (!id || !title || !company) {
    return null;
  }

  return {
    id,
    title,
    company,
    location: getStringValue(row.location),
    sourceUrl: getStringValue(row.linkedin_url),
    externalApplyUrl: getStringValue(row.external_apply_url),
    description: getStringValue(row.description),
    matchScore: getMatchScore(row.match_score),
    matchReason:
      getStringValue(row.match_reason) ||
      "The agent found some overlap, but this role did not have enough matching evidence to classify it as a strong match.",
    status: getStringValue(row.status) || "found",
    coverLetter: getStringValue(row.cover_letter),
    resumeUrl: getStringValue(row.resume_url),
    isTailored: getBooleanValue(row.is_tailored),
    foundAt: getStringValue(row.found_at),
    appliedAt: getStringValue(row.applied_at),
    errorMessage: getStringValue(row.error_message),
    hasBaseResume,
    isEasyApply:
      !getStringValue(row.external_apply_url).trim() &&
      Boolean(getStringValue(row.linkedin_url).trim()),
    linkedinConnected,
  };
}

async function loadJobDetails(jobId: string): Promise<JobDetailsLoadResult> {
  const normalizedJobId = jobId.trim();

  if (!normalizedJobId) {
    notFound();
  }

  const user = await requireCurrentUser();
  const accessToken = await getAccessToken();

  if (!accessToken) {
    return {
      success: false,
      error: "Your session expired. Sign in again to load this job.",
    };
  }

  const insforge = createInsforgeServer(accessToken);
  const jobResult = await insforge.database
    .from("jobs")
    .select(
      "id,title,company,location,linkedin_url,external_apply_url,description,match_score,match_reason,status,cover_letter,resume_url,is_tailored,found_at,applied_at,error_message",
    )
    .eq("id", normalizedJobId)
    .eq("user_id", user.id)
    .limit(1);

  if (jobResult.error) {
    console.error("[jobs/details/loadJobDetails]", jobResult.error);
    return {
      success: false,
      error: "Could not load this job. Try refreshing the page.",
    };
  }

  const jobRow = getFirstJobRow(jobResult.data);

  if (!jobRow) {
    notFound();
  }

  const profileResult = await insforge.database
    .from("profiles")
    .select("resume_pdf_url,linkedin_connected")
    .eq("id", user.id)
    .limit(1);

  if (profileResult.error) {
    console.error("[jobs/details/loadProfileResume]", profileResult.error);
    return {
      success: false,
      error: "Could not load your resume preview. Try refreshing the page.",
    };
  }

  const profileRow = getFirstProfileRow(profileResult.data);
  const hasBaseResume = Boolean(
    profileRow && getStringValue(profileRow.resume_pdf_url).trim(),
  );
  const linkedinConnected = Boolean(
    profileRow && getBooleanValue(profileRow.linkedin_connected),
  );
  const job = normalizeJobDetails(jobRow, hasBaseResume, linkedinConnected);

  if (!job) {
    notFound();
  }

  return {
    success: true,
    job,
  };
}

function JobDetailsLoadError({ message }: { message: string }) {
  return (
    <section className="rounded-2xl border border-default bg-surface">
      <div className="border-b border-default px-5 py-4">
        <p className="text-sm text-accent-text">Job details</p>
        <h1 className="mt-1 text-3xl font-semibold text-text-primary">
          Could not load job
        </h1>
      </div>
      <div className="p-5">
        <div className="rounded-2xl border border-state-error/20 bg-state-error-dim p-4">
          <p className="text-sm font-medium text-state-error">{message}</p>
        </div>
      </div>
    </section>
  );
}

export default async function JobDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const jobDetailsResult = await loadJobDetails(id);

  return (
    <section>
      {jobDetailsResult.success ? (
        <JobDetails job={jobDetailsResult.job} />
      ) : (
        <JobDetailsLoadError message={jobDetailsResult.error} />
      )}
    </section>
  );
}
