import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

import { getAccessToken, getCurrentUser } from "@/lib/auth";
import { createInsforgeServer } from "@/lib/insforge-server";
import {
  generateResumeContent,
  getBaseResumePathForUser,
  hasEnoughResumeEvidence,
  renderResumePdf,
  type ResumeProfile,
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
  is_complete?: unknown;
};

type UploadData = {
  url?: unknown;
};

function jsonResponse(body: ApiResponse, status: number): NextResponse {
  return NextResponse.json(body, { status });
}

async function validateEmptyBody(request: NextRequest): Promise<boolean> {
  const contentLength = request.headers.get("content-length");

  if (!contentLength || contentLength === "0") {
    return true;
  }

  try {
    const body: unknown = await request.json();
    return (
      body !== null &&
      typeof body === "object" &&
      Object.keys(body).length === 0
    );
  } catch {
    return false;
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
  return value !== null && typeof value === "object";
}

function isUploadData(value: unknown): value is UploadData {
  return value !== null && typeof value === "object";
}

function isMissingObjectError(value: unknown): boolean {
  if (value === null || typeof value !== "object") {
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

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const hasValidBody = await validateEmptyBody(request);

    if (!hasValidBody) {
      return jsonResponse(
        { success: false, error: "Resume generation does not accept input." },
        400,
      );
    }

    const accessToken = await getAccessToken({ persistCookies: true });
    const user = await getCurrentUser({ persistCookies: true });

    if (!user || !accessToken) {
      return jsonResponse(
        { success: false, error: "Sign in again to generate your resume." },
        401,
      );
    }

    const insforge = createInsforgeServer(accessToken);
    const profileResult = await insforge.database
      .from("profiles")
      .select(
        "full_name,email,phone,location,job_title,experience_level,years_experience,skills,remote_preference,linkedin_url,portfolio_url,resume_work_experience,resume_projects,resume_education,resume_achievements,is_complete",
      )
      .eq("id", user.id)
      .maybeSingle();

    if (profileResult.error) {
      console.error("[api/resume/generate]", profileResult.error);
      return jsonResponse(
        { success: false, error: "Could not load your saved profile." },
        500,
      );
    }

    if (!isProfileRow(profileResult.data)) {
      return jsonResponse(
        { success: false, error: "Save your profile before generating a resume." },
        400,
      );
    }

    if (profileResult.data.is_complete !== true) {
      return jsonResponse(
        {
          success: false,
          error: "Complete and save your profile before generating a resume.",
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
            "Add real work experience, projects, or achievements before generating an application-quality resume.",
        },
        400,
      );
    }

    const resumeContent = await generateResumeContent(resumeProfile);
    const pdfBuffer = await renderResumePdf(resumeProfile, resumeContent);
    const resumePath = getBaseResumePathForUser(user.id);
    const bucket = insforge.storage.from("resumes");
    const removeResult = await bucket.remove(resumePath);

    if (removeResult.error && !isMissingObjectError(removeResult.error)) {
      console.error("[api/resume/generate]", removeResult.error);
    }

    const pdfBlob = new Blob([new Uint8Array(pdfBuffer)], {
      type: "application/pdf",
    });
    const uploadResult = await bucket.upload(resumePath, pdfBlob);

    if (uploadResult.error || !isUploadData(uploadResult.data)) {
      console.error("[api/resume/generate]", uploadResult.error);
      return jsonResponse(
        { success: false, error: "Could not upload your generated resume." },
        500,
      );
    }

    const resumeUrl = getStringValue(uploadResult.data.url);

    if (!resumeUrl) {
      console.error("[api/resume/generate]", "Upload did not return a URL.");
      return jsonResponse(
        { success: false, error: "Could not save your generated resume." },
        500,
      );
    }

    const updateResult = await insforge.database
      .from("profiles")
      .update({ resume_pdf_url: resumeUrl })
      .eq("id", user.id)
      .select("resume_pdf_url");

    if (updateResult.error) {
      console.error("[api/resume/generate]", updateResult.error);
      return jsonResponse(
        { success: false, error: "Could not save your resume URL." },
        500,
      );
    }

    revalidatePath("/profile");

    return jsonResponse({ success: true, data: { resumeUrl } }, 200);
  } catch (error) {
    console.error("[api/resume/generate]", error);
    return jsonResponse(
      { success: false, error: "Could not generate your resume." },
      500,
    );
  }
}
