import { ProfileForm } from "@/components/profile/ProfileForm";
import { getAccessToken, requireCurrentUser } from "@/lib/auth";
import { createInsforgeServer } from "@/lib/insforge-server";
import type {
  BackgroundCheckConsent,
  CoverLetterTone,
  DisabilityStatus,
  ExperienceLevel,
  GenderIdentity,
  HispanicLatinoIdentity,
  ProfileFormData,
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

type ProfileLoadResult =
  | {
      success: true;
      profile: ProfileFormData;
      hasSavedProfile: boolean;
      resumePdfUrl: string;
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
  cover_letter_tone?: unknown;
  linkedin_url?: unknown;
  portfolio_url?: unknown;
  resume_work_experience?: unknown;
  resume_projects?: unknown;
  resume_education?: unknown;
  resume_achievements?: unknown;
  work_authorization?: unknown;
  sponsorship_requirement?: unknown;
  salary_expectation?: unknown;
  start_availability?: unknown;
  relocation_preference?: unknown;
  background_check_consent?: unknown;
  gender_identity?: unknown;
  hispanic_latino_identity?: unknown;
  veteran_status?: unknown;
  disability_status?: unknown;
  application_notes?: unknown;
  resume_pdf_url?: unknown;
};

function buildBlankProfile(email: string): ProfileFormData {
  return {
    first_name: "",
    last_name: "",
    full_name: "",
    email,
    phone: "",
    location: "",
    job_title: "",
    experience_level: "mid",
    years_experience: 0,
    skills: [],
    remote_preference: "any",
    cover_letter_tone: "formal",
    linkedin_url: "",
    portfolio_url: "",
    resume_work_experience: "",
    resume_projects: "",
    resume_education: "",
    resume_achievements: "",
    work_authorization: "",
    sponsorship_requirement: "",
    salary_expectation: "",
    start_availability: "",
    relocation_preference: "",
    background_check_consent: "",
    gender_identity: "",
    hispanic_latino_identity: "",
    veteran_status: "",
    disability_status: "",
    application_notes: "",
  };
}

function getStringValue(value: unknown): string {
  return typeof value === "string" ? value : "";
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

function getYearsExperience(value: unknown): number {
  return Number.isInteger(value) && typeof value === "number" && value >= 0
    ? value
    : 0;
}

function getSkills(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (skill: unknown): skill is string =>
      typeof skill === "string" && skill.trim().length > 0,
  );
}

function isExperienceLevel(value: unknown): value is ExperienceLevel {
  return (
    typeof value === "string" &&
    EXPERIENCE_LEVELS.some((level: ExperienceLevel) => level === value)
  );
}

function isRemotePreference(value: unknown): value is RemotePreference {
  return (
    typeof value === "string" &&
    REMOTE_PREFERENCES.some(
      (preference: RemotePreference) => preference === value,
    )
  );
}

function isCoverLetterTone(value: unknown): value is CoverLetterTone {
  return (
    typeof value === "string" &&
    COVER_LETTER_TONES.some((tone: CoverLetterTone) => tone === value)
  );
}

function includesStringValue<T extends string>(
  values: T[],
  value: unknown,
): value is T {
  return (
    typeof value === "string" && values.some((item: T) => item === value)
  );
}

function isProfileRow(value: unknown): value is ProfileRow {
  return value !== null && typeof value === "object";
}

function normalizeProfileRow(
  row: ProfileRow | null,
  fallbackEmail: string,
): ProfileFormData {
  if (!row) {
    return buildBlankProfile(fallbackEmail);
  }

  const fullName = getStringValue(row.full_name);
  const nameParts = splitFullName(fullName);

  return {
    first_name: nameParts.firstName,
    last_name: nameParts.lastName,
    full_name: fullName,
    email: getStringValue(row.email) || fallbackEmail,
    phone: getStringValue(row.phone),
    location: getStringValue(row.location),
    job_title: getStringValue(row.job_title),
    experience_level: isExperienceLevel(row.experience_level)
      ? row.experience_level
      : "mid",
    years_experience: getYearsExperience(row.years_experience),
    skills: getSkills(row.skills),
    remote_preference: isRemotePreference(row.remote_preference)
      ? row.remote_preference
      : "any",
    cover_letter_tone: isCoverLetterTone(row.cover_letter_tone)
      ? row.cover_letter_tone
      : "formal",
    linkedin_url: getStringValue(row.linkedin_url),
    portfolio_url: getStringValue(row.portfolio_url),
    resume_work_experience: getStringValue(row.resume_work_experience),
    resume_projects: getStringValue(row.resume_projects),
    resume_education: getStringValue(row.resume_education),
    resume_achievements: getStringValue(row.resume_achievements),
    work_authorization: includesStringValue(
      WORK_AUTHORIZATIONS,
      row.work_authorization,
    )
      ? row.work_authorization
      : "",
    sponsorship_requirement: includesStringValue(
      SPONSORSHIP_REQUIREMENTS,
      row.sponsorship_requirement,
    )
      ? row.sponsorship_requirement
      : "",
    salary_expectation: getStringValue(row.salary_expectation),
    start_availability: getStringValue(row.start_availability),
    relocation_preference: includesStringValue(
      RELOCATION_PREFERENCES,
      row.relocation_preference,
    )
      ? row.relocation_preference
      : "",
    background_check_consent: includesStringValue(
      BACKGROUND_CHECK_CONSENTS,
      row.background_check_consent,
    )
      ? row.background_check_consent
      : "",
    gender_identity: includesStringValue(GENDER_IDENTITIES, row.gender_identity)
      ? row.gender_identity
      : "",
    hispanic_latino_identity: includesStringValue(
      HISPANIC_LATINO_IDENTITIES,
      row.hispanic_latino_identity,
    )
      ? row.hispanic_latino_identity
      : "",
    veteran_status: includesStringValue(VETERAN_STATUSES, row.veteran_status)
      ? row.veteran_status
      : "",
    disability_status: includesStringValue(
      DISABILITY_STATUSES,
      row.disability_status,
    )
      ? row.disability_status
      : "",
    application_notes: getStringValue(row.application_notes),
  };
}

async function loadProfile(): Promise<ProfileLoadResult> {
  const user = await requireCurrentUser();
  const accessToken = await getAccessToken();

  if (!accessToken) {
    return {
      success: false,
      error: "Your session expired. Sign in again to load your profile.",
    };
  }

  const insforge = createInsforgeServer(accessToken);
  const result = await insforge.database
    .from("profiles")
    .select(
      "full_name,email,phone,location,job_title,experience_level,years_experience,skills,remote_preference,cover_letter_tone,linkedin_url,portfolio_url,resume_work_experience,resume_projects,resume_education,resume_achievements,work_authorization,sponsorship_requirement,salary_expectation,start_availability,relocation_preference,background_check_consent,gender_identity,hispanic_latino_identity,veteran_status,disability_status,application_notes,resume_pdf_url",
    )
    .eq("id", user.id)
    .maybeSingle();

  if (result.error) {
    console.error("[profile/loadProfile]", result.error);
    return {
      success: false,
      error: "Could not load your saved profile. Try refreshing the page.",
    };
  }

  return {
    success: true,
    profile: normalizeProfileRow(
      isProfileRow(result.data) ? result.data : null,
      user.email ?? "",
    ),
    hasSavedProfile: isProfileRow(result.data),
    resumePdfUrl: isProfileRow(result.data)
      ? getStringValue(result.data.resume_pdf_url)
      : "",
  };
}

function ProfileLoadError({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-default bg-surface">
      <div className="border-b border-default px-5 py-4">
        <p className="text-sm text-accent-text">Profile</p>
        <h1 className="mt-1 text-3xl font-semibold text-text-primary">
          Build your agent profile
        </h1>
      </div>
      <div className="p-5">
        <div className="rounded-2xl border border-state-error/20 bg-state-error-dim p-4">
          <p className="text-sm font-medium text-state-error">{message}</p>
        </div>
      </div>
    </div>
  );
}

export default async function ProfilePage() {
  const profileResult = await loadProfile();

  return (
    <section>
      {profileResult.success ? (
        <ProfileForm
          initialProfile={profileResult.profile}
          hasSavedProfile={profileResult.hasSavedProfile}
          initialResumeUrl={profileResult.resumePdfUrl}
        />
      ) : (
        <ProfileLoadError message={profileResult.error} />
      )}
    </section>
  );
}
