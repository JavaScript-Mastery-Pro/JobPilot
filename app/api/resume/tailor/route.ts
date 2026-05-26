import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

import { getAccessToken, getCurrentUser } from "@/lib/auth";
import { createInsforgeServer } from "@/lib/insforge-server";
import {
  generateTailoredResumeContent,
  getTailoredResumePathForJob,
  hasEnoughResumeEvidence,
  renderResumePdf,
  type ResumeProfile,
  type TailoredResumeJob,
} from "@/lib/resume";

type ApiResponse =
  | {
      success: true;
      data: {
        resumeUrl: string;
      };
    }
  | {
      success: false;
      error: string;
    };

type RequestBody = {
  jobId?: unknown;
};

type ProfileRow = {
  full_name?: unknown;
  email?: unknown;
  phone?: unknown;
  location?: unknown;
  job_title?: unknown;
  experience_level?: unknown;
  years_experience?: unknown;
  skills?: unknown;
  remote_preference?: unknown;
  linkedin_url?: unknown;
  portfolio_url?: unknown;
  resume_work_experience?: unknown;
  resume_projects?: unknown;
  resume_education?: unknown;
  resume_achievements?: unknown;
  resume_pdf_url?: unknown;
  is_complete?: unknown;
};

type JobRow = {
  title?: unknown;
  company?: unknown;
  location?: unknown;
  description?: unknown;
  match_score?: unknown;
  match_reason?: unknown;
};

type UploadData = {
  url?: unknown;
};

function jsonResponse(body: ApiResponse, status: number): NextResponse {
  return NextResponse.json(body, { status });
}

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isRequestBody(value: unknown): value is RequestBody {
  return isObject(value);
}

async function parseRequestBody(request: NextRequest): Promise<RequestBody | null> {
  try {
    const body: unknown = await request.json();
    return isRequestBody(body) ? body : null;
  } catch {
    return null;
  }
}

function getStringValue(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function getYearsExperience(value: unknown): number {
  return Number.isInteger(value) && typeof value === "number" && value >= 0
    ? value
    : 0;
}

function getMatchScore(value: unknown): number {
  return Number.isInteger(value) && typeof value === "number" ? value : 0;
}

function getSkills(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((skill: unknown): skill is string => typeof skill === "string")
    .map((skill: string) => skill.trim())
    .filter(Boolean);
}

function isProfileRow(value: unknown): value is ProfileRow {
  return isObject(value);
}

function isJobRow(value: unknown): value is JobRow {
  return isObject(value);
}

function isUploadData(value: unknown): value is UploadData {
  return isObject(value);
}

function isMissingObjectError(value: unknown): boolean {
  if (!isObject(value)) {
    return false;
  }

  return (
    ("statusCode" in value && value.statusCode === 404) ||
    ("error" in value && value.error === "NOT_FOUND")
  );
}

function buildResumeProfile(row: ProfileRow): ResumeProfile {
  return {
    fullName: getStringValue(row.full_name),
    email: getStringValue(row.email),
    phone: getStringValue(row.phone),
    location: getStringValue(row.location),
    targetRole: getStringValue(row.job_title),
    experienceLevel: getStringValue(row.experience_level),
    yearsExperience: getYearsExperience(row.years_experience),
    skills: getSkills(row.skills),
    remotePreference: getStringValue(row.remote_preference),
    linkedinUrl: getStringValue(row.linkedin_url),
    portfolioUrl: getStringValue(row.portfolio_url),
    workExperience: getStringValue(row.resume_work_experience),
    projects: getStringValue(row.resume_projects),
    education: getStringValue(row.resume_education),
    achievements: getStringValue(row.resume_achievements),
  };
}

function buildTailoredResumeJob(row: JobRow): TailoredResumeJob | null {
  const title = getStringValue(row.title);
  const company = getStringValue(row.company);
  const description = getStringValue(row.description);
  const matchReason = getStringValue(row.match_reason);

  if (!title || !company) {
    return null;
  }

  if ([description, matchReason].join(" ").trim().length < 80) {
    return null;
  }

  return {
    title,
    company,
    location: getStringValue(row.location),
    description,
    matchScore: getMatchScore(row.match_score),
    matchReason,
  };
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const accessToken = await getAccessToken({ persistCookies: true });
    const user = await getCurrentUser({ persistCookies: true });

    if (!user || !accessToken) {
      return jsonResponse(
        { success: false, error: "Sign in again to tailor your resume." },
        401,
      );
    }

    const body = await parseRequestBody(request);
    const jobId = body ? getStringValue(body.jobId) : "";

    if (!jobId) {
      return jsonResponse(
        { success: false, error: "Choose a job before tailoring your resume." },
        400,
      );
    }

    const insforge = createInsforgeServer(accessToken);
    const profileResult = await insforge.database
      .from("profiles")
      .select(
        "full_name,email,phone,location,job_title,experience_level,years_experience,skills,remote_preference,linkedin_url,portfolio_url,resume_work_experience,resume_projects,resume_education,resume_achievements,resume_pdf_url,is_complete",
      )
      .eq("id", user.id)
      .maybeSingle();

    if (profileResult.error) {
      console.error("[api/resume/tailor]", profileResult.error);
      return jsonResponse(
        { success: false, error: "Could not load your saved profile." },
        500,
      );
    }

    if (!isProfileRow(profileResult.data)) {
      return jsonResponse(
        { success: false, error: "Save your profile before tailoring a resume." },
        400,
      );
    }

    if (profileResult.data.is_complete !== true) {
      return jsonResponse(
        {
          success: false,
          error: "Complete and save your profile before tailoring a resume.",
        },
        400,
      );
    }

    if (!getStringValue(profileResult.data.resume_pdf_url)) {
      return jsonResponse(
        {
          success: false,
          error: "Generate your base resume before tailoring it for a job.",
        },
        400,
      );
    }

    const resumeProfile = buildResumeProfile(profileResult.data);

    if (!hasEnoughResumeEvidence(resumeProfile)) {
      return jsonResponse(
        {
          success: false,
          error:
            "Add real work experience, projects, or achievements before tailoring an application-quality resume.",
        },
        400,
      );
    }

    const jobResult = await insforge.database
      .from("jobs")
      .select("title,company,location,description,match_score,match_reason")
      .eq("id", jobId)
      .eq("user_id", user.id)
      .limit(1);

    if (jobResult.error) {
      console.error("[api/resume/tailor]", jobResult.error);
      return jsonResponse(
        { success: false, error: "Could not load this job." },
        500,
      );
    }

    const jobRow = Array.isArray(jobResult.data) ? jobResult.data[0] : null;
    const tailoredJob = isJobRow(jobRow) ? buildTailoredResumeJob(jobRow) : null;

    if (!tailoredJob) {
      return jsonResponse(
        {
          success: false,
          error:
            "This job needs a title, company, and enough role context before tailoring.",
        },
        400,
      );
    }

    const resumeContent = await generateTailoredResumeContent(
      resumeProfile,
      tailoredJob,
    );
    const pdfBuffer = await renderResumePdf(resumeProfile, resumeContent);
    const resumePath = getTailoredResumePathForJob(user.id, jobId);
    const bucket = insforge.storage.from("resumes");
    const removeResult = await bucket.remove(resumePath);

    if (removeResult.error && !isMissingObjectError(removeResult.error)) {
      console.error("[api/resume/tailor]", removeResult.error);
    }

    const pdfBlob = new Blob([new Uint8Array(pdfBuffer)], {
      type: "application/pdf",
    });
    const uploadResult = await bucket.upload(resumePath, pdfBlob);

    if (uploadResult.error || !isUploadData(uploadResult.data)) {
      console.error("[api/resume/tailor]", uploadResult.error);
      return jsonResponse(
        { success: false, error: "Could not upload your tailored resume." },
        500,
      );
    }

    const resumeUrl = getStringValue(uploadResult.data.url);

    if (!resumeUrl) {
      console.error("[api/resume/tailor]", "Upload did not return a URL.");
      return jsonResponse(
        { success: false, error: "Could not save your tailored resume." },
        500,
      );
    }

    const updateResult = await insforge.database
      .from("jobs")
      .update({ resume_url: resumeUrl, is_tailored: true })
      .eq("id", jobId)
      .eq("user_id", user.id)
      .select("id");

    if (updateResult.error) {
      console.error("[api/resume/tailor]", updateResult.error);
      return jsonResponse(
        { success: false, error: "Could not save your tailored resume." },
        500,
      );
    }

    revalidatePath(`/jobs/${jobId}`);

    return jsonResponse({ success: true, data: { resumeUrl } }, 200);
  } catch (error) {
    console.error("[api/resume/tailor]", error);
    return jsonResponse(
      { success: false, error: "Could not tailor your resume." },
      500,
    );
  }
}
