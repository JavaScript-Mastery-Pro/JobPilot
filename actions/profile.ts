"use server";

import { revalidatePath } from "next/cache";

import { getAccessToken, getCurrentUser } from "@/lib/auth";
import { createInsforgeServer } from "@/lib/insforge-server";
import type {
  BackgroundCheckConsent,
  CoverLetterTone,
  DisabilityStatus,
  ExperienceLevel,
  GenderIdentity,
  HispanicLatinoIdentity,
  ProfileFormData,
  ProfileSaveResult,
  ProfileValidationErrors,
  RelocationPreference,
  RemotePreference,
  SponsorshipRequirement,
  VeteranStatus,
  WorkAuthorization,
} from "@/types";

const EXPERIENCE_LEVELS: ExperienceLevel[] = ["junior", "mid", "senior", "lead"];
const REMOTE_PREFERENCES: RemotePreference[] = [
  "remote",
  "onsite",
  "hybrid",
  "any",
];
const COVER_LETTER_TONES: CoverLetterTone[] = [
  "formal",
  "casual",
  "enthusiastic",
];
const WORK_AUTHORIZATIONS: WorkAuthorization[] = [
  "",
  "authorized",
  "not_authorized",
  "prefer_not_to_answer",
];
const SPONSORSHIP_REQUIREMENTS: SponsorshipRequirement[] = [
  "",
  "no",
  "yes_now",
  "yes_future",
  "prefer_not_to_answer",
];
const RELOCATION_PREFERENCES: RelocationPreference[] = [
  "",
  "yes",
  "no",
  "open",
  "prefer_not_to_answer",
];
const BACKGROUND_CHECK_CONSENTS: BackgroundCheckConsent[] = [
  "",
  "yes",
  "no",
  "prefer_not_to_answer",
];
const GENDER_IDENTITIES: GenderIdentity[] = [
  "",
  "female",
  "male",
  "non_binary",
  "self_describe",
  "prefer_not_to_answer",
];
const HISPANIC_LATINO_IDENTITIES: HispanicLatinoIdentity[] = [
  "",
  "yes",
  "no",
  "prefer_not_to_answer",
];
const VETERAN_STATUSES: VeteranStatus[] = [
  "",
  "protected_veteran",
  "not_protected_veteran",
  "not_veteran",
  "prefer_not_to_answer",
];
const DISABILITY_STATUSES: DisabilityStatus[] = [
  "",
  "yes",
  "no",
  "prefer_not_to_answer",
];

function getFullName(profile: ProfileFormData): string {
  return [profile.first_name, profile.last_name]
    .map((namePart: string) => namePart.trim())
    .filter(Boolean)
    .join(" ");
}

function normalizeProfile(input: ProfileFormData): ProfileFormData {
  const firstName = input.first_name.trim();
  const lastName = input.last_name.trim();

  return {
    first_name: firstName,
    last_name: lastName,
    full_name: getFullName(input),
    email: input.email.trim(),
    phone: input.phone.trim(),
    location: input.location.trim(),
    job_title: input.job_title.trim(),
    experience_level: input.experience_level,
    years_experience: input.years_experience,
    skills: input.skills.map((skill: string) => skill.trim()).filter(Boolean),
    remote_preference: input.remote_preference,
    cover_letter_tone: input.cover_letter_tone,
    linkedin_url: input.linkedin_url.trim(),
    portfolio_url: input.portfolio_url.trim(),
    resume_work_experience: input.resume_work_experience.trim(),
    resume_projects: input.resume_projects.trim(),
    resume_education: input.resume_education.trim(),
    resume_achievements: input.resume_achievements.trim(),
    work_authorization: input.work_authorization,
    sponsorship_requirement: input.sponsorship_requirement,
    salary_expectation: input.salary_expectation.trim(),
    start_availability: input.start_availability.trim(),
    relocation_preference: input.relocation_preference,
    background_check_consent: input.background_check_consent,
    gender_identity: input.gender_identity,
    hispanic_latino_identity: input.hispanic_latino_identity,
    veteran_status: input.veteran_status,
    disability_status: input.disability_status,
    application_notes: input.application_notes.trim(),
  };
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidOptionalUrl(value: string): boolean {
  if (!value) {
    return true;
  }

  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function includesValue<T extends string>(values: T[], value: string): value is T {
  return values.some((item: T) => item === value);
}

function validateProfile(input: ProfileFormData): {
  data: ProfileFormData;
  errors: ProfileValidationErrors;
  isComplete: boolean;
} {
  const data = normalizeProfile(input);
  const errors: ProfileValidationErrors = {};

  if (!data.first_name) {
    errors.first_name = "Enter your first name.";
  }

  if (!data.last_name) {
    errors.last_name = "Enter your last name.";
  }

  if (!data.email) {
    errors.email = "Enter your email.";
  } else if (!isValidEmail(data.email)) {
    errors.email = "Enter a valid email address.";
  }

  if (!data.phone) {
    errors.phone = "Enter your phone number.";
  }

  if (!data.location) {
    errors.location = "Enter your location.";
  }

  if (!data.job_title) {
    errors.job_title = "Enter the job title you want.";
  }

  if (!includesValue(EXPERIENCE_LEVELS, data.experience_level)) {
    errors.experience_level = "Choose an experience level.";
  }

  if (!Number.isInteger(data.years_experience) || data.years_experience < 0) {
    errors.years_experience = "Enter years of experience as 0 or higher.";
  }

  if (data.skills.length === 0) {
    errors.skills = "Add at least one skill.";
  }

  if (!includesValue(REMOTE_PREFERENCES, data.remote_preference)) {
    errors.remote_preference = "Choose a remote preference.";
  }

  if (!includesValue(COVER_LETTER_TONES, data.cover_letter_tone)) {
    errors.cover_letter_tone = "Choose a cover letter tone.";
  }

  if (!includesValue(WORK_AUTHORIZATIONS, data.work_authorization)) {
    errors.work_authorization = "Choose a work authorization answer.";
  }

  if (!includesValue(SPONSORSHIP_REQUIREMENTS, data.sponsorship_requirement)) {
    errors.sponsorship_requirement = "Choose a sponsorship answer.";
  }

  if (!includesValue(RELOCATION_PREFERENCES, data.relocation_preference)) {
    errors.relocation_preference = "Choose a relocation answer.";
  }

  if (
    !includesValue(BACKGROUND_CHECK_CONSENTS, data.background_check_consent)
  ) {
    errors.background_check_consent = "Choose a background check answer.";
  }

  if (!includesValue(GENDER_IDENTITIES, data.gender_identity)) {
    errors.gender_identity = "Choose a gender disclosure answer.";
  }

  if (
    !includesValue(HISPANIC_LATINO_IDENTITIES, data.hispanic_latino_identity)
  ) {
    errors.hispanic_latino_identity =
      "Choose a Hispanic/Latino disclosure answer.";
  }

  if (!includesValue(VETERAN_STATUSES, data.veteran_status)) {
    errors.veteran_status = "Choose a veteran status answer.";
  }

  if (!includesValue(DISABILITY_STATUSES, data.disability_status)) {
    errors.disability_status = "Choose a disability status answer.";
  }

  if (!isValidOptionalUrl(data.linkedin_url)) {
    errors.linkedin_url = "Enter a valid LinkedIn URL.";
  }

  if (!isValidOptionalUrl(data.portfolio_url)) {
    errors.portfolio_url = "Enter a valid portfolio URL.";
  }

  return {
    data,
    errors,
    isComplete: Object.keys(errors).length === 0,
  };
}

export async function saveProfile(
  input: ProfileFormData,
): Promise<ProfileSaveResult> {
  try {
    const { data, errors, isComplete } = validateProfile(input);

    if (Object.keys(errors).length > 0) {
      return {
        success: false,
        error: "Fix the highlighted fields before saving.",
        fieldErrors: errors,
      };
    }

    const accessToken = await getAccessToken({ persistCookies: true });
    const user = await getCurrentUser({ persistCookies: true });

    if (!user) {
      return {
        success: false,
        error: "Your session expired. Sign in again to save your profile.",
      };
    }

    if (!accessToken) {
      return {
        success: false,
        error: "Your session expired. Sign in again to save your profile.",
      };
    }

    const insforge = createInsforgeServer(accessToken);
    const payload = {
      id: user.id,
      full_name: data.full_name,
      email: data.email,
      phone: data.phone,
      location: data.location,
      job_title: data.job_title,
      experience_level: data.experience_level,
      years_experience: data.years_experience,
      skills: data.skills,
      remote_preference: data.remote_preference,
      cover_letter_tone: data.cover_letter_tone,
      linkedin_url: data.linkedin_url,
      portfolio_url: data.portfolio_url,
      resume_work_experience: data.resume_work_experience,
      resume_projects: data.resume_projects,
      resume_education: data.resume_education,
      resume_achievements: data.resume_achievements,
      work_authorization: data.work_authorization,
      sponsorship_requirement: data.sponsorship_requirement,
      salary_expectation: data.salary_expectation,
      start_availability: data.start_availability,
      relocation_preference: data.relocation_preference,
      background_check_consent: data.background_check_consent,
      gender_identity: data.gender_identity,
      hispanic_latino_identity: data.hispanic_latino_identity,
      veteran_status: data.veteran_status,
      disability_status: data.disability_status,
      application_notes: data.application_notes,
      is_complete: isComplete,
    };

    const existing = await insforge.database
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    if (existing.error) {
      console.error("[actions/profile/saveProfile]", existing.error);
      return {
        success: false,
        error: "Could not check your saved profile. Try again.",
      };
    }

    const existingProfile =
      existing.data &&
      typeof existing.data === "object" &&
      "id" in existing.data &&
      typeof existing.data.id === "string"
        ? existing.data
        : null;

    const result = existingProfile
      ? await insforge.database
          .from("profiles")
          .update(payload)
          .eq("id", user.id)
          .select()
      : await insforge.database.from("profiles").insert(payload).select();

    if (result.error) {
      console.error("[actions/profile/saveProfile]", result.error);
      return {
        success: false,
        error: "Could not save your profile. Try again.",
      };
    }

    revalidatePath("/profile");

    return { success: true };
  } catch (error) {
    console.error("[actions/profile/saveProfile]", error);
    return {
      success: false,
      error: "Could not save your profile. Try again.",
    };
  }
}
