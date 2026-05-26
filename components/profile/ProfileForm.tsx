"use client";

import {
  AlertTriangle,
  CheckCircle2,
  Download,
  Eye,
  RefreshCcw,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";

import { saveProfile } from "@/actions/profile";
import {
  getMissingProfileFields,
  REQUIRED_PROFILE_FIELDS,
} from "@/components/profile/CompletionIndicator";
import { EvidenceEntryCard } from "@/components/profile/EvidenceEntryCard";
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
  ResumeGenerateResult,
  RelocationPreference,
  RemotePreference,
  SponsorshipRequirement,
  VeteranStatus,
  WorkAuthorization,
} from "@/types";

const INPUT_CLASS =
  "bg-subtle border border-default rounded-xl h-10 px-3 text-text-primary placeholder:text-text-muted focus:border-accent-border focus:ring-1 focus:ring-accent-border transition-colors outline-none";
const SELECT_CLASS =
  "bg-subtle border border-default rounded-xl h-10 px-3 text-text-primary focus:border-accent-border focus:ring-1 focus:ring-accent-border transition-colors outline-none";
const FIELD_CLASS = "flex flex-col gap-1.5";
const LABEL_CLASS = "text-sm font-medium text-text-secondary";
const HELPER_CLASS = "text-xs text-text-muted";
const ERROR_CLASS = "text-xs text-state-error";
const TEXTAREA_CLASS =
  "min-h-24 rounded-xl border border-default bg-subtle px-3 py-3 text-sm text-text-primary outline-none transition-colors placeholder:text-text-muted focus:border-accent-border focus:ring-1 focus:ring-accent-border";
const SECTION_CLASS = "border-t border-default pt-6";
const SECTION_HEADER_CLASS = "mb-5 flex flex-col gap-2";
const ACTION_BUTTON_CLASS =
  "h-9 rounded-xl border border-default bg-surface px-4 text-sm font-medium text-text-secondary transition-colors hover:border-subtle hover:bg-subtle hover:text-text-primary";
const EVIDENCE_GROUP_CLASS = "grid gap-5";
const EVIDENCE_GROUP_HEADER_CLASS =
  "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between";

const EXPERIENCE_OPTIONS: { label: string; value: ExperienceLevel }[] = [
  { label: "Junior", value: "junior" },
  { label: "Mid-level", value: "mid" },
  { label: "Senior", value: "senior" },
  { label: "Lead", value: "lead" },
];

const REMOTE_OPTIONS: { label: string; value: RemotePreference }[] = [
  { label: "Remote", value: "remote" },
  { label: "Onsite", value: "onsite" },
  { label: "Hybrid", value: "hybrid" },
  { label: "Any", value: "any" },
];

const TONE_OPTIONS: { label: string; value: CoverLetterTone }[] = [
  { label: "Formal", value: "formal" },
  { label: "Casual", value: "casual" },
  { label: "Enthusiastic", value: "enthusiastic" },
];

const WORK_AUTHORIZATION_OPTIONS: {
  label: string;
  value: WorkAuthorization;
}[] = [
  { label: "Select an answer", value: "" },
  { label: "Authorized to work", value: "authorized" },
  { label: "Not currently authorized", value: "not_authorized" },
  { label: "Prefer not to answer", value: "prefer_not_to_answer" },
];

const SPONSORSHIP_OPTIONS: {
  label: string;
  value: SponsorshipRequirement;
}[] = [
  { label: "Select an answer", value: "" },
  { label: "No sponsorship needed", value: "no" },
  { label: "Need sponsorship now", value: "yes_now" },
  { label: "May need sponsorship in the future", value: "yes_future" },
  { label: "Prefer not to answer", value: "prefer_not_to_answer" },
];

const RELOCATION_OPTIONS: {
  label: string;
  value: RelocationPreference;
}[] = [
  { label: "Select an answer", value: "" },
  { label: "Yes", value: "yes" },
  { label: "No", value: "no" },
  { label: "Open to discussing", value: "open" },
  { label: "Prefer not to answer", value: "prefer_not_to_answer" },
];

const BACKGROUND_CHECK_OPTIONS: {
  label: string;
  value: BackgroundCheckConsent;
}[] = [
  { label: "Select an answer", value: "" },
  { label: "Yes", value: "yes" },
  { label: "No", value: "no" },
  { label: "Prefer not to answer", value: "prefer_not_to_answer" },
];

const GENDER_OPTIONS: { label: string; value: GenderIdentity }[] = [
  { label: "Select an answer", value: "" },
  { label: "Female", value: "female" },
  { label: "Male", value: "male" },
  { label: "Non-binary", value: "non_binary" },
  { label: "Self-describe", value: "self_describe" },
  { label: "Prefer not to answer", value: "prefer_not_to_answer" },
];

const HISPANIC_LATINO_OPTIONS: {
  label: string;
  value: HispanicLatinoIdentity;
}[] = [
  { label: "Select an answer", value: "" },
  { label: "Yes", value: "yes" },
  { label: "No", value: "no" },
  { label: "Prefer not to answer", value: "prefer_not_to_answer" },
];

const VETERAN_STATUS_OPTIONS: { label: string; value: VeteranStatus }[] = [
  { label: "Select an answer", value: "" },
  { label: "Protected veteran", value: "protected_veteran" },
  { label: "Not a protected veteran", value: "not_protected_veteran" },
  { label: "Not a veteran", value: "not_veteran" },
  { label: "Prefer not to answer", value: "prefer_not_to_answer" },
];

const DISABILITY_STATUS_OPTIONS: { label: string; value: DisabilityStatus }[] =
  [
    { label: "Select an answer", value: "" },
    { label: "Yes, I have a disability", value: "yes" },
    { label: "No, I do not have a disability", value: "no" },
    { label: "Prefer not to answer", value: "prefer_not_to_answer" },
  ];

type Props = {
  initialProfile: ProfileFormData;
  hasSavedProfile: boolean;
  initialResumeUrl: string;
};

type TextFieldKey = Exclude<
  keyof ProfileFormData,
  | "skills"
  | "years_experience"
  | "experience_level"
  | "remote_preference"
  | "cover_letter_tone"
  | "work_authorization"
  | "sponsorship_requirement"
  | "relocation_preference"
  | "background_check_consent"
  | "gender_identity"
  | "hispanic_latino_identity"
  | "veteran_status"
  | "disability_status"
>;

type WorkEntry = {
  id: string;
  company: string;
  role: string;
  dates: string;
  bullets: string;
};

type ProjectEntry = {
  id: string;
  name: string;
  link: string;
  stack: string;
  bullets: string;
};

type EducationEntry = {
  id: string;
  school: string;
  credential: string;
  dates: string;
  notes: string;
};

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidOptionalUrl(value: string): boolean {
  if (!value.trim()) {
    return true;
  }

  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function getFullName(profile: ProfileFormData): string {
  return [profile.first_name, profile.last_name]
    .map((namePart: string) => namePart.trim())
    .filter(Boolean)
    .join(" ");
}

function validateProfile(profile: ProfileFormData): ProfileValidationErrors {
  const errors: ProfileValidationErrors = {};

  if (!profile.first_name.trim()) {
    errors.first_name = "Enter your first name.";
  }

  if (!profile.last_name.trim()) {
    errors.last_name = "Enter your last name.";
  }

  if (!profile.email.trim()) {
    errors.email = "Enter your email.";
  } else if (!isValidEmail(profile.email.trim())) {
    errors.email = "Enter a valid email address.";
  }

  if (!profile.phone.trim()) {
    errors.phone = "Enter your phone number.";
  }

  if (!profile.location.trim()) {
    errors.location = "Enter your location.";
  }

  if (!profile.job_title.trim()) {
    errors.job_title = "Enter the job title you want.";
  }

  if (
    !Number.isInteger(profile.years_experience) ||
    profile.years_experience < 0
  ) {
    errors.years_experience = "Enter years of experience as 0 or higher.";
  }

  if (profile.skills.length === 0) {
    errors.skills = "Add at least one skill.";
  }

  if (!isValidOptionalUrl(profile.linkedin_url)) {
    errors.linkedin_url = "Enter a valid LinkedIn URL.";
  }

  if (!isValidOptionalUrl(profile.portfolio_url)) {
    errors.portfolio_url = "Enter a valid portfolio URL.";
  }

  return errors;
}

function getProfileFingerprint(profile: ProfileFormData): string {
  return JSON.stringify({
    first_name: profile.first_name.trim(),
    last_name: profile.last_name.trim(),
    full_name: getFullName(profile),
    email: profile.email.trim(),
    phone: profile.phone.trim(),
    location: profile.location.trim(),
    job_title: profile.job_title.trim(),
    experience_level: profile.experience_level,
    years_experience: profile.years_experience,
    skills: profile.skills.map((skill: string) => skill.trim()).filter(Boolean),
    remote_preference: profile.remote_preference,
    cover_letter_tone: profile.cover_letter_tone,
    linkedin_url: profile.linkedin_url.trim(),
    portfolio_url: profile.portfolio_url.trim(),
    resume_work_experience: profile.resume_work_experience.trim(),
    resume_projects: profile.resume_projects.trim(),
    resume_education: profile.resume_education.trim(),
    resume_achievements: profile.resume_achievements.trim(),
    work_authorization: profile.work_authorization,
    sponsorship_requirement: profile.sponsorship_requirement,
    salary_expectation: profile.salary_expectation.trim(),
    start_availability: profile.start_availability.trim(),
    relocation_preference: profile.relocation_preference,
    background_check_consent: profile.background_check_consent,
    gender_identity: profile.gender_identity,
    hispanic_latino_identity: profile.hispanic_latino_identity,
    veteran_status: profile.veteran_status,
    disability_status: profile.disability_status,
    application_notes: profile.application_notes.trim(),
  });
}

function getResumeEvidenceLength(profile: ProfileFormData): number {
  return [
    profile.resume_work_experience,
    profile.resume_projects,
    profile.resume_education,
    profile.resume_achievements,
  ]
    .join(" ")
    .trim().length;
}

function isExperienceLevel(value: string): value is ExperienceLevel {
  return EXPERIENCE_OPTIONS.some((option) => option.value === value);
}

function isRemotePreference(value: string): value is RemotePreference {
  return REMOTE_OPTIONS.some((option) => option.value === value);
}

function isCoverLetterTone(value: string): value is CoverLetterTone {
  return TONE_OPTIONS.some((option) => option.value === value);
}

function isWorkAuthorization(value: string): value is WorkAuthorization {
  return WORK_AUTHORIZATION_OPTIONS.some((option) => option.value === value);
}

function isSponsorshipRequirement(
  value: string,
): value is SponsorshipRequirement {
  return SPONSORSHIP_OPTIONS.some((option) => option.value === value);
}

function isRelocationPreference(value: string): value is RelocationPreference {
  return RELOCATION_OPTIONS.some((option) => option.value === value);
}

function isBackgroundCheckConsent(
  value: string,
): value is BackgroundCheckConsent {
  return BACKGROUND_CHECK_OPTIONS.some((option) => option.value === value);
}

function isGenderIdentity(value: string): value is GenderIdentity {
  return GENDER_OPTIONS.some((option) => option.value === value);
}

function isHispanicLatinoIdentity(
  value: string,
): value is HispanicLatinoIdentity {
  return HISPANIC_LATINO_OPTIONS.some((option) => option.value === value);
}

function isVeteranStatus(value: string): value is VeteranStatus {
  return VETERAN_STATUS_OPTIONS.some((option) => option.value === value);
}

function isDisabilityStatus(value: string): value is DisabilityStatus {
  return DISABILITY_STATUS_OPTIONS.some((option) => option.value === value);
}

function getAutoApplyMissingFields(profile: ProfileFormData): string[] {
  const fields = [
    { label: "Work authorization", value: profile.work_authorization },
    { label: "Sponsorship", value: profile.sponsorship_requirement },
    { label: "Salary expectation", value: profile.salary_expectation },
    { label: "Start availability", value: profile.start_availability },
    { label: "Relocation", value: profile.relocation_preference },
    { label: "Background check", value: profile.background_check_consent },
    { label: "Gender", value: profile.gender_identity },
    { label: "Hispanic/Latino", value: profile.hispanic_latino_identity },
    { label: "Veteran status", value: profile.veteran_status },
    { label: "Disability status", value: profile.disability_status },
  ];

  return fields
    .filter((field) => field.value.trim().length === 0)
    .map((field) => field.label);
}

function createEntryId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`;
}

function createBlankWorkEntry(id: string = createEntryId("work")): WorkEntry {
  return {
    id,
    company: "",
    role: "",
    dates: "",
    bullets: "",
  };
}

function createBlankProjectEntry(
  id: string = createEntryId("project"),
): ProjectEntry {
  return {
    id,
    name: "",
    link: "",
    stack: "",
    bullets: "",
  };
}

function createBlankEducationEntry(
  id: string = createEntryId("education"),
): EducationEntry {
  return {
    id,
    school: "",
    credential: "",
    dates: "",
    notes: "",
  };
}

function splitSerializedEntries(value: string): string[] {
  return value
    .split(/\n-{3,}\n/)
    .map((entry: string) => entry.trim())
    .filter(Boolean);
}

function getSerializedValue(block: string, label: string): string {
  const line = block
    .split("\n")
    .find((item: string) => item.startsWith(`${label}:`));

  return line ? line.slice(label.length + 1).trim() : "";
}

function getSerializedBullets(block: string): string {
  const lines = block.split("\n");
  const bulletsIndex = lines.findIndex((line: string) => line === "Bullets:");

  if (bulletsIndex === -1) {
    return "";
  }

  return lines
    .slice(bulletsIndex + 1)
    .map((line: string) => line.replace(/^- /, "").trim())
    .filter(Boolean)
    .join("\n");
}

function getSerializedNotes(block: string): string {
  const lines = block.split("\n");
  const notesIndex = lines.findIndex((line: string) => line === "Notes:");

  if (notesIndex === -1) {
    return "";
  }

  return lines
    .slice(notesIndex + 1)
    .map((line: string) => line.replace(/^- /, "").trim())
    .filter(Boolean)
    .join("\n");
}

function parseWorkEntries(value: string): WorkEntry[] {
  if (!value.trim()) {
    return [createBlankWorkEntry("work-1")];
  }

  const entries = splitSerializedEntries(value).map(
    (block: string, index: number) => ({
      id: `work-${index + 1}`,
      company: getSerializedValue(block, "Company"),
      role: getSerializedValue(block, "Role"),
      dates: getSerializedValue(block, "Dates"),
      bullets: getSerializedBullets(block) || block,
    }),
  );

  return entries.length > 0 ? entries : [createBlankWorkEntry("work-1")];
}

function parseProjectEntries(value: string): ProjectEntry[] {
  if (!value.trim()) {
    return [createBlankProjectEntry("project-1")];
  }

  const entries = splitSerializedEntries(value).map(
    (block: string, index: number) => ({
      id: `project-${index + 1}`,
      name: getSerializedValue(block, "Project"),
      link: getSerializedValue(block, "Link"),
      stack: getSerializedValue(block, "Stack"),
      bullets: getSerializedBullets(block) || block,
    }),
  );

  return entries.length > 0 ? entries : [createBlankProjectEntry("project-1")];
}

function parseEducationEntries(value: string): EducationEntry[] {
  if (!value.trim()) {
    return [createBlankEducationEntry("education-1")];
  }

  const entries = splitSerializedEntries(value).map(
    (block: string, index: number) => ({
      id: `education-${index + 1}`,
      school: getSerializedValue(block, "School"),
      credential: getSerializedValue(block, "Credential"),
      dates: getSerializedValue(block, "Dates"),
      notes: getSerializedNotes(block) || block,
    }),
  );

  return entries.length > 0
    ? entries
    : [createBlankEducationEntry("education-1")];
}

function serializeBulletLines(value: string): string[] {
  return value
    .split("\n")
    .map((line: string) => line.replace(/^- /, "").trim())
    .filter(Boolean)
    .map((line: string) => `- ${line}`);
}

function serializeWorkEntries(entries: WorkEntry[]): string {
  return entries
    .map((entry: WorkEntry) => {
      const bullets = serializeBulletLines(entry.bullets);
      const lines = [
        entry.company.trim() ? `Company: ${entry.company.trim()}` : "",
        entry.role.trim() ? `Role: ${entry.role.trim()}` : "",
        entry.dates.trim() ? `Dates: ${entry.dates.trim()}` : "",
        bullets.length > 0 ? "Bullets:" : "",
        ...bullets,
      ].filter(Boolean);

      return lines.join("\n");
    })
    .filter(Boolean)
    .join("\n---\n");
}

function serializeProjectEntries(entries: ProjectEntry[]): string {
  return entries
    .map((entry: ProjectEntry) => {
      const bullets = serializeBulletLines(entry.bullets);
      const lines = [
        entry.name.trim() ? `Project: ${entry.name.trim()}` : "",
        entry.link.trim() ? `Link: ${entry.link.trim()}` : "",
        entry.stack.trim() ? `Stack: ${entry.stack.trim()}` : "",
        bullets.length > 0 ? "Bullets:" : "",
        ...bullets,
      ].filter(Boolean);

      return lines.join("\n");
    })
    .filter(Boolean)
    .join("\n---\n");
}

function serializeEducationEntries(entries: EducationEntry[]): string {
  return entries
    .map((entry: EducationEntry) => {
      const notes = serializeBulletLines(entry.notes);
      const lines = [
        entry.school.trim() ? `School: ${entry.school.trim()}` : "",
        entry.credential.trim() ? `Credential: ${entry.credential.trim()}` : "",
        entry.dates.trim() ? `Dates: ${entry.dates.trim()}` : "",
        notes.length > 0 ? "Notes:" : "",
        ...notes,
      ].filter(Boolean);

      return lines.join("\n");
    })
    .filter(Boolean)
    .join("\n---\n");
}

function getInitialExpandedEntryIds(
  workEntries: WorkEntry[],
  projectEntries: ProjectEntry[],
  educationEntries: EducationEntry[],
): string[] {
  return [
    ...workEntries.map((entry: WorkEntry) => entry.id),
    ...projectEntries.map((entry: ProjectEntry) => entry.id),
    ...educationEntries.map((entry: EducationEntry) => entry.id),
  ];
}

function getWorkEntryTitle(entry: WorkEntry, index: number): string {
  return entry.company.trim() || `Work entry ${index + 1}`;
}

function getWorkEntryMeta(entry: WorkEntry): string {
  return [entry.role.trim(), entry.dates.trim()].filter(Boolean).join(" · ");
}

function getProjectEntryTitle(entry: ProjectEntry, index: number): string {
  return entry.name.trim() || `Project entry ${index + 1}`;
}

function getProjectEntryMeta(entry: ProjectEntry): string {
  return [entry.stack.trim(), entry.link.trim()].filter(Boolean).join(" · ");
}

function getEducationEntryTitle(entry: EducationEntry, index: number): string {
  return entry.school.trim() || `Education entry ${index + 1}`;
}

function getEducationEntryMeta(entry: EducationEntry): string {
  return [entry.credential.trim(), entry.dates.trim()]
    .filter(Boolean)
    .join(" · ");
}

export function ProfileForm({
  initialProfile,
  hasSavedProfile,
  initialResumeUrl,
}: Props) {
  const initialWorkEntries = useMemo<WorkEntry[]>(
    () => parseWorkEntries(initialProfile.resume_work_experience),
    [initialProfile.resume_work_experience],
  );
  const initialProjectEntries = useMemo<ProjectEntry[]>(
    () => parseProjectEntries(initialProfile.resume_projects),
    [initialProfile.resume_projects],
  );
  const initialEducationEntries = useMemo<EducationEntry[]>(
    () => parseEducationEntries(initialProfile.resume_education),
    [initialProfile.resume_education],
  );
  const [profile, setProfile] = useState<ProfileFormData>(initialProfile);
  const [savedProfile, setSavedProfile] =
    useState<ProfileFormData>(initialProfile);
  const [workEntries, setWorkEntries] =
    useState<WorkEntry[]>(initialWorkEntries);
  const [projectEntries, setProjectEntries] = useState<ProjectEntry[]>(
    initialProjectEntries,
  );
  const [educationEntries, setEducationEntries] = useState<EducationEntry[]>(
    initialEducationEntries,
  );
  const [expandedEntryIds, setExpandedEntryIds] = useState<string[]>(() =>
    getInitialExpandedEntryIds(
      initialWorkEntries,
      initialProjectEntries,
      initialEducationEntries,
    ),
  );
  const [isEditingSavedProfile, setIsEditingSavedProfile] =
    useState<boolean>(hasSavedProfile);
  const [resumeUrl, setResumeUrl] = useState<string>(initialResumeUrl);
  const [resumePreviewVersion, setResumePreviewVersion] = useState<number>(0);
  const [isResumePreviewOpen, setIsResumePreviewOpen] =
    useState<boolean>(false);
  const [resumeResult, setResumeResult] = useState<ResumeGenerateResult | null>(
    null,
  );
  const [isGeneratingResume, startResumeTransition] = useTransition();
  const [skillInput, setSkillInput] = useState<string>("");
  const [errors, setErrors] = useState<ProfileValidationErrors>({});
  const [result, setResult] = useState<ProfileSaveResult | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!isResumePreviewOpen) {
      return;
    }

    function closeOnEscape(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        setIsResumePreviewOpen(false);
      }
    }

    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isResumePreviewOpen]);

  const clientErrors = useMemo<ProfileValidationErrors>(
    () => validateProfile(profile),
    [profile],
  );

  function updateTextField(key: TextFieldKey, value: string): void {
    setProfile((current: ProfileFormData) => ({
      ...current,
      [key]: value,
    }));
  }

  function updateYearsExperience(value: string): void {
    const parsed = Number.parseInt(value, 10);
    setProfile((current: ProfileFormData) => ({
      ...current,
      years_experience: Number.isNaN(parsed) ? 0 : parsed,
    }));
  }

  function addSkill(): void {
    const nextSkill = skillInput.trim();

    if (!nextSkill) {
      return;
    }

    setProfile((current: ProfileFormData) => {
      const skillExists = current.skills.some(
        (skill: string) => skill.toLowerCase() === nextSkill.toLowerCase(),
      );

      if (skillExists) {
        return current;
      }

      return {
        ...current,
        skills: [...current.skills, nextSkill],
      };
    });
    setSkillInput("");
  }

  function removeSkill(skillToRemove: string): void {
    setProfile((current: ProfileFormData) => ({
      ...current,
      skills: current.skills.filter((skill: string) => skill !== skillToRemove),
    }));
  }

  function expandEntry(entryId: string): void {
    setExpandedEntryIds((current: string[]) =>
      current.includes(entryId) ? current : [...current, entryId],
    );
  }

  function toggleEntry(entryId: string): void {
    setExpandedEntryIds((current: string[]) =>
      current.includes(entryId)
        ? current.filter((id: string) => id !== entryId)
        : [...current, entryId],
    );
  }

  function syncWorkEntries(nextEntries: WorkEntry[]): void {
    setWorkEntries(nextEntries);
    setProfile((current: ProfileFormData) => ({
      ...current,
      resume_work_experience: serializeWorkEntries(nextEntries),
    }));
  }

  function syncProjectEntries(nextEntries: ProjectEntry[]): void {
    setProjectEntries(nextEntries);
    setProfile((current: ProfileFormData) => ({
      ...current,
      resume_projects: serializeProjectEntries(nextEntries),
    }));
  }

  function syncEducationEntries(nextEntries: EducationEntry[]): void {
    setEducationEntries(nextEntries);
    setProfile((current: ProfileFormData) => ({
      ...current,
      resume_education: serializeEducationEntries(nextEntries),
    }));
  }

  function updateWorkEntry(
    entryId: string,
    key: keyof Omit<WorkEntry, "id">,
    value: string,
  ): void {
    syncWorkEntries(
      workEntries.map((entry: WorkEntry) =>
        entry.id === entryId ? { ...entry, [key]: value } : entry,
      ),
    );
  }

  function updateProjectEntry(
    entryId: string,
    key: keyof Omit<ProjectEntry, "id">,
    value: string,
  ): void {
    syncProjectEntries(
      projectEntries.map((entry: ProjectEntry) =>
        entry.id === entryId ? { ...entry, [key]: value } : entry,
      ),
    );
  }

  function updateEducationEntry(
    entryId: string,
    key: keyof Omit<EducationEntry, "id">,
    value: string,
  ): void {
    syncEducationEntries(
      educationEntries.map((entry: EducationEntry) =>
        entry.id === entryId ? { ...entry, [key]: value } : entry,
      ),
    );
  }

  function addWorkEntry(): void {
    const nextEntry = createBlankWorkEntry();
    syncWorkEntries([...workEntries, nextEntry]);
    expandEntry(nextEntry.id);
  }

  function addProjectEntry(): void {
    const nextEntry = createBlankProjectEntry();
    syncProjectEntries([...projectEntries, nextEntry]);
    expandEntry(nextEntry.id);
  }

  function addEducationEntry(): void {
    const nextEntry = createBlankEducationEntry();
    syncEducationEntries([...educationEntries, nextEntry]);
    expandEntry(nextEntry.id);
  }

  function removeWorkEntry(entryId: string): void {
    if (workEntries.length <= 1) {
      return;
    }

    syncWorkEntries(
      workEntries.filter((entry: WorkEntry) => entry.id !== entryId),
    );
    setExpandedEntryIds((current: string[]) =>
      current.filter((id: string) => id !== entryId),
    );
  }

  function removeProjectEntry(entryId: string): void {
    if (projectEntries.length <= 1) {
      return;
    }

    syncProjectEntries(
      projectEntries.filter((entry: ProjectEntry) => entry.id !== entryId),
    );
    setExpandedEntryIds((current: string[]) =>
      current.filter((id: string) => id !== entryId),
    );
  }

  function removeEducationEntry(entryId: string): void {
    if (educationEntries.length <= 1) {
      return;
    }

    syncEducationEntries(
      educationEntries.filter((entry: EducationEntry) => entry.id !== entryId),
    );
    setExpandedEntryIds((current: string[]) =>
      current.filter((id: string) => id !== entryId),
    );
  }

  function handleSubmit(): void {
    const nextErrors = validateProfile(profile);
    setErrors(nextErrors);
    setResult(null);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    startTransition(async () => {
      const saveResult = await saveProfile(profile);
      setResult(saveResult);
      setErrors(saveResult.fieldErrors ?? {});

      if (saveResult.success) {
        setSavedProfile(profile);
        setIsEditingSavedProfile(true);
      }
    });
  }

  function handleGenerateResume(): void {
    setResumeResult(null);

    startResumeTransition(async () => {
      try {
        const response = await fetch("/api/resume/generate", {
          method: "POST",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({}),
        });
        const data: unknown = await response.json();

        if (
          data !== null &&
          typeof data === "object" &&
          "success" in data &&
          data.success === true &&
          "data" in data &&
          data.data !== null &&
          typeof data.data === "object" &&
          "resumeUrl" in data.data &&
          typeof data.data.resumeUrl === "string"
        ) {
          setResumeUrl(data.data.resumeUrl);
          setResumePreviewVersion((current: number) => current + 1);
          setResumeResult({
            success: true,
            data: { resumeUrl: data.data.resumeUrl },
          });
          return;
        }

        const error =
          data !== null &&
          typeof data === "object" &&
          "error" in data &&
          typeof data.error === "string"
            ? data.error
            : "Could not generate your resume.";

        setResumeResult({ success: false, error });
      } catch (error) {
        console.error("[ProfileForm/handleGenerateResume]", error);
        setResumeResult({
          success: false,
          error: "Could not generate your resume.",
        });
      }
    });
  }

  const visibleErrors = Object.keys(errors).length > 0 ? errors : clientErrors;
  const missingFields = getMissingProfileFields(profile);
  const autoApplyMissingFields = getAutoApplyMissingFields(profile);
  const autoApplyReady = autoApplyMissingFields.length === 0;
  const completedFieldCount =
    REQUIRED_PROFILE_FIELDS.length - missingFields.length;
  const isProfileComplete = Object.keys(clientErrors).length === 0;
  const resumeEvidenceLength = getResumeEvidenceLength(profile);
  const resumeEvidenceMinimum = 160;
  const hasResumeEvidence = resumeEvidenceLength >= resumeEvidenceMinimum;
  const hasUnsavedProfileChanges =
    getProfileFingerprint(profile) !== getProfileFingerprint(savedProfile);
  const canGenerateResume =
    isEditingSavedProfile &&
    isProfileComplete &&
    hasResumeEvidence &&
    !hasUnsavedProfileChanges;
  const resumeHelpText = !isEditingSavedProfile
    ? "Save your profile before generating a resume."
    : hasUnsavedProfileChanges
      ? "Save your latest profile changes before generating a resume."
      : !isProfileComplete
        ? "Complete the missing profile fields before generating a resume."
        : !hasResumeEvidence
          ? "Add real work, project, or achievement evidence before generating a job-ready resume."
          : resumeUrl
            ? "Preview your generated PDF or regenerate it from your saved profile evidence."
            : "Generate an ATS-friendly PDF from your saved profile evidence.";
  const resumeBlockers = [
    !isEditingSavedProfile ? "Save your profile first." : "",
    hasUnsavedProfileChanges ? "Save your latest profile changes." : "",
    !isProfileComplete
      ? `Complete ${Object.keys(clientErrors).length} missing profile ${
          Object.keys(clientErrors).length === 1 ? "field" : "fields"
        }.`
      : "",
    !hasResumeEvidence
      ? `Add ${resumeEvidenceMinimum - resumeEvidenceLength} more characters of real work, project, or education evidence.`
      : "",
  ].filter(Boolean);
  const shouldShowResumeBlockers =
    resumeBlockers.length > 0 && !isGeneratingResume;
  const resumePreviewSrc = `/api/resume/preview?v=${resumePreviewVersion}`;

  return (
    <>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          handleSubmit();
        }}
        className="grid gap-8">
        <div>
          <p className="text-sm text-accent-text">Profile</p>
          <h1 className="mt-1 text-3xl font-semibold text-text-primary">
            {isEditingSavedProfile
              ? "Edit your agent profile"
              : "Build your agent profile"}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-text-secondary">
            {isEditingSavedProfile
              ? "Keep these details current so JobPilot scores roles and prepares application materials with the right context."
              : "These details give JobPilot enough context to find relevant roles, score matches, and prepare application materials."}
          </p>
        </div>

        <div className="grid gap-4 border-t border-default pt-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
            <div
              className={
                isProfileComplete
                  ? "rounded-2xl border border-state-success/20 bg-state-success-dim p-4"
                  : "rounded-2xl border border-state-warning/20 bg-state-warning-dim p-4"
              }>
              <div className="flex items-start gap-3">
                {isProfileComplete ? (
                  <CheckCircle2
                    className="mt-0.5 h-5 w-5 shrink-0 text-state-success"
                    aria-hidden="true"
                  />
                ) : (
                  <AlertTriangle
                    className="mt-0.5 h-5 w-5 shrink-0 text-state-warning"
                    aria-hidden="true"
                  />
                )}
                <div>
                  <p
                    className={
                      isProfileComplete
                        ? "text-sm font-medium text-state-success"
                        : "text-sm font-medium text-state-warning"
                    }>
                    {isProfileComplete
                      ? "Agent profile ready"
                      : "Agent profile needs attention"}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-text-secondary">
                    {isProfileComplete
                      ? "Your required details are complete. Save changes before generating or regenerating resume materials."
                      : missingFields.length > 0
                        ? `Complete ${missingFields.length} required ${
                            missingFields.length === 1 ? "field" : "fields"
                          } before running JobPilot.`
                        : "Fix the highlighted profile fields before running JobPilot."}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-default bg-elevated p-4">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-text-muted">
                    Readiness
                  </p>
                  <p className="mt-1 text-2xl font-bold text-text-primary">
                    {completedFieldCount}/{REQUIRED_PROFILE_FIELDS.length}
                  </p>
                </div>
                <p className="text-xs text-text-muted">required fields</p>
              </div>
              <div className="mt-4 grid grid-cols-10 gap-1">
                {REQUIRED_PROFILE_FIELDS.map((field, index) => (
                  <div
                    key={field.key}
                    className={
                      index < completedFieldCount
                        ? "h-1.5 rounded-full bg-accent-primary"
                        : "h-1.5 rounded-full bg-subtle"
                    }
                  />
                ))}
              </div>
            </div>

          {missingFields.length > 0 ? (
            <div className="flex flex-wrap gap-2 lg:col-span-2">
              {missingFields.map((field) => (
                <span
                  key={field.key}
                  className="inline-flex items-center rounded-full border border-state-warning/20 bg-state-warning-dim px-2.5 py-1 text-xs font-medium text-state-warning">
                  {field.label}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        <div className="grid gap-8">
          <section className={SECTION_CLASS}>
            <div className={SECTION_HEADER_CLASS}>
              <p className="text-sm text-accent-text">Step 1</p>
              <h2 className="mt-1 text-xl font-semibold text-text-primary">
                Contact details
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-text-secondary">
                These fields identify you on applications and generated
                documents.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className={FIELD_CLASS}>
                <label className={LABEL_CLASS} htmlFor="first_name">
                  First name
                </label>
                <input
                  id="first_name"
                  value={profile.first_name}
                  onChange={(event) =>
                    updateTextField("first_name", event.target.value)
                  }
                  className={INPUT_CLASS}
                  placeholder="Ada"
                />
                {visibleErrors.first_name ? (
                  <p className={ERROR_CLASS}>{visibleErrors.first_name}</p>
                ) : null}
              </div>

              <div className={FIELD_CLASS}>
                <label className={LABEL_CLASS} htmlFor="last_name">
                  Last name
                </label>
                <input
                  id="last_name"
                  value={profile.last_name}
                  onChange={(event) =>
                    updateTextField("last_name", event.target.value)
                  }
                  className={INPUT_CLASS}
                  placeholder="Lovelace"
                />
                {visibleErrors.last_name ? (
                  <p className={ERROR_CLASS}>{visibleErrors.last_name}</p>
                ) : null}
              </div>

              <div className={FIELD_CLASS}>
                <label className={LABEL_CLASS} htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={profile.email}
                  onChange={(event) =>
                    updateTextField("email", event.target.value)
                  }
                  className={INPUT_CLASS}
                  placeholder="you@example.com"
                />
                {visibleErrors.email ? (
                  <p className={ERROR_CLASS}>{visibleErrors.email}</p>
                ) : null}
              </div>

              <div className={FIELD_CLASS}>
                <label className={LABEL_CLASS} htmlFor="phone">
                  Phone
                </label>
                <input
                  id="phone"
                  value={profile.phone}
                  onChange={(event) =>
                    updateTextField("phone", event.target.value)
                  }
                  className={INPUT_CLASS}
                  placeholder="+1 555 0100"
                />
                {visibleErrors.phone ? (
                  <p className={ERROR_CLASS}>{visibleErrors.phone}</p>
                ) : null}
              </div>

              <div className={FIELD_CLASS}>
                <label className={LABEL_CLASS} htmlFor="location">
                  Location
                </label>
                <input
                  id="location"
                  value={profile.location}
                  onChange={(event) =>
                    updateTextField("location", event.target.value)
                  }
                  className={INPUT_CLASS}
                  placeholder="San Francisco, CA"
                />
                {visibleErrors.location ? (
                  <p className={ERROR_CLASS}>{visibleErrors.location}</p>
                ) : null}
              </div>
            </div>
          </section>

          <section className={SECTION_CLASS}>
            <div className={SECTION_HEADER_CLASS}>
              <p className="text-sm text-accent-text">Step 2</p>
              <h2 className="mt-1 text-xl font-semibold text-text-primary">
                Target role
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-text-secondary">
                JobPilot uses this to search, score, and prioritize matching
                roles.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
            <div className={FIELD_CLASS}>
              <label className={LABEL_CLASS} htmlFor="job_title">
                Target role
              </label>
              <input
                id="job_title"
                value={profile.job_title}
                onChange={(event) =>
                  updateTextField("job_title", event.target.value)
                }
                className={INPUT_CLASS}
                placeholder="Frontend engineer"
              />
              {visibleErrors.job_title ? (
                <p className={ERROR_CLASS}>{visibleErrors.job_title}</p>
              ) : null}
            </div>

            <div className={FIELD_CLASS}>
              <label className={LABEL_CLASS} htmlFor="years_experience">
                Years of experience
              </label>
              <input
                id="years_experience"
                type="number"
                min="0"
                value={profile.years_experience}
                onChange={(event) => updateYearsExperience(event.target.value)}
                className={INPUT_CLASS}
              />
              {visibleErrors.years_experience ? (
                <p className={ERROR_CLASS}>{visibleErrors.years_experience}</p>
              ) : null}
            </div>

            <div className={FIELD_CLASS}>
              <label className={LABEL_CLASS} htmlFor="experience_level">
                Experience level
              </label>
              <select
                id="experience_level"
                value={profile.experience_level}
                onChange={(event) => {
                  const nextValue = event.target.value;

                  if (isExperienceLevel(nextValue)) {
                    setProfile((current: ProfileFormData) => ({
                      ...current,
                      experience_level: nextValue,
                    }));
                  }
                }}
                className={SELECT_CLASS}>
                {EXPERIENCE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className={FIELD_CLASS}>
              <label className={LABEL_CLASS} htmlFor="remote_preference">
                Work preference
              </label>
              <select
                id="remote_preference"
                value={profile.remote_preference}
                onChange={(event) => {
                  const nextValue = event.target.value;

                  if (isRemotePreference(nextValue)) {
                    setProfile((current: ProfileFormData) => ({
                      ...current,
                      remote_preference: nextValue,
                    }));
                  }
                }}
                className={SELECT_CLASS}>
                {REMOTE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            </div>
          </section>

          <section className={SECTION_CLASS}>
            <div className={SECTION_HEADER_CLASS}>
              <p className="text-sm text-accent-text">Step 3</p>
              <h2 className="mt-1 text-xl font-semibold text-text-primary">
                Skills
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-text-secondary">
                Add the strongest skills the agent should match against job
                listings.
              </p>
            </div>
            <div className="grid gap-4">
            <div className={FIELD_CLASS}>
              <label className={LABEL_CLASS} htmlFor="skills">
                Skills
              </label>
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-3 sm:flex-row">
                  <input
                    id="skills"
                    value={skillInput}
                    onChange={(event) => setSkillInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        addSkill();
                      }
                    }}
                    className={`${INPUT_CLASS} flex-1`}
                    placeholder="React, TypeScript, Playwright"
                  />
                  <button
                    type="button"
                    onClick={addSkill}
                    className={ACTION_BUTTON_CLASS}>
                    Add skill
                  </button>
                </div>

                {profile.skills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {profile.skills.map((skill: string) => (
                      <span
                        key={skill}
                        className="inline-flex items-center gap-1.5 rounded-full border border-accent-border bg-accent-dim px-2.5 py-1 text-xs text-accent-text">
                        {skill}
                        <button
                          type="button"
                          onClick={() => removeSkill(skill)}
                          className="text-accent-text transition-colors hover:text-text-primary"
                          aria-label={`Remove ${skill}`}>
                          x
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className={HELPER_CLASS}>
                    Add the skills the agent should match against job listings.
                  </p>
                )}
              </div>
              {visibleErrors.skills ? (
                <p className={ERROR_CLASS}>{visibleErrors.skills}</p>
              ) : null}
            </div>
            </div>
          </section>

          <section className={SECTION_CLASS}>
            <div className={SECTION_HEADER_CLASS}>
              <p className="text-sm text-accent-text">Step 4</p>
              <h2 className="mt-1 text-xl font-semibold text-text-primary">
                Application preferences
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-text-secondary">
                These settings shape generated cover letters and optional
                profile links.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
            <div className={FIELD_CLASS}>
              <label className={LABEL_CLASS} htmlFor="cover_letter_tone">
                Cover letter tone
              </label>
              <select
                id="cover_letter_tone"
                value={profile.cover_letter_tone}
                onChange={(event) => {
                  const nextValue = event.target.value;

                  if (isCoverLetterTone(nextValue)) {
                    setProfile((current: ProfileFormData) => ({
                      ...current,
                      cover_letter_tone: nextValue,
                    }));
                  }
                }}
                className={SELECT_CLASS}>
                {TONE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className={FIELD_CLASS}>
              <label className={LABEL_CLASS} htmlFor="linkedin_url">
                LinkedIn URL
              </label>
              <input
                id="linkedin_url"
                value={profile.linkedin_url}
                onChange={(event) =>
                  updateTextField("linkedin_url", event.target.value)
                }
                className={INPUT_CLASS}
                placeholder="https://linkedin.com/in/you"
              />
              <p className={HELPER_CLASS}>Optional for profile completion.</p>
              {visibleErrors.linkedin_url ? (
                <p className={ERROR_CLASS}>{visibleErrors.linkedin_url}</p>
              ) : null}
            </div>

            <div className={FIELD_CLASS}>
              <label className={LABEL_CLASS} htmlFor="portfolio_url">
                Portfolio URL
              </label>
              <input
                id="portfolio_url"
                value={profile.portfolio_url}
                onChange={(event) =>
                  updateTextField("portfolio_url", event.target.value)
                }
                className={INPUT_CLASS}
                placeholder="https://your-site.com"
              />
              <p className={HELPER_CLASS}>Optional for profile completion.</p>
              {visibleErrors.portfolio_url ? (
                <p className={ERROR_CLASS}>{visibleErrors.portfolio_url}</p>
              ) : null}
            </div>
            </div>
          </section>

          <section className={SECTION_CLASS}>
            <div className={SECTION_HEADER_CLASS}>
              <p className="text-sm text-accent-text">Step 5</p>
              <h2 className="mt-1 text-xl font-semibold text-text-primary">
                Application questions
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-text-secondary">
                These answers document common application responses without
                guessing sensitive or legal information.
              </p>
            </div>

            <div
              className={
                autoApplyReady
                  ? "mb-5 rounded-2xl border border-state-success/20 bg-state-success-dim p-4"
                  : "mb-5 rounded-2xl border border-state-warning/20 bg-state-warning-dim p-4"
              }>
              <p
                className={
                  autoApplyReady
                    ? "text-sm font-medium text-state-success"
                    : "text-sm font-medium text-state-warning"
                }>
                {autoApplyReady
                  ? "Application answers ready"
                  : "Application answers incomplete"}
              </p>
              <p className="mt-1 text-xs leading-5 text-text-secondary">
                {autoApplyReady
                  ? "These saved answers can support recurring legal and disclosure questions."
                  : `Complete ${autoApplyMissingFields.length} application ${
                      autoApplyMissingFields.length === 1 ? "answer" : "answers"
                    } to reduce review stops during application review.`}
              </p>
              {!autoApplyReady ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {autoApplyMissingFields.map((field: string) => (
                    <span
                      key={field}
                      className="inline-flex rounded-full border border-state-warning/20 bg-surface px-2.5 py-1 text-xs font-medium text-state-warning">
                      {field}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className={FIELD_CLASS}>
                <label className={LABEL_CLASS} htmlFor="work_authorization">
                  Work authorization
                </label>
                <select
                  id="work_authorization"
                  value={profile.work_authorization}
                  onChange={(event) => {
                    const nextValue = event.target.value;

                    if (isWorkAuthorization(nextValue)) {
                      setProfile((current: ProfileFormData) => ({
                        ...current,
                        work_authorization: nextValue,
                      }));
                    }
                  }}
                  className={SELECT_CLASS}>
                  {WORK_AUTHORIZATION_OPTIONS.map((option) => (
                    <option key={option.value || "empty"} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className={FIELD_CLASS}>
                <label
                  className={LABEL_CLASS}
                  htmlFor="sponsorship_requirement">
                  Sponsorship
                </label>
                <select
                  id="sponsorship_requirement"
                  value={profile.sponsorship_requirement}
                  onChange={(event) => {
                    const nextValue = event.target.value;

                    if (isSponsorshipRequirement(nextValue)) {
                      setProfile((current: ProfileFormData) => ({
                        ...current,
                        sponsorship_requirement: nextValue,
                      }));
                    }
                  }}
                  className={SELECT_CLASS}>
                  {SPONSORSHIP_OPTIONS.map((option) => (
                    <option key={option.value || "empty"} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className={FIELD_CLASS}>
                <label className={LABEL_CLASS} htmlFor="salary_expectation">
                  Salary expectation
                </label>
                <input
                  id="salary_expectation"
                  value={profile.salary_expectation}
                  onChange={(event) =>
                    updateTextField("salary_expectation", event.target.value)
                  }
                  className={INPUT_CLASS}
                  placeholder="$120,000-$140,000 or open to market"
                />
              </div>

              <div className={FIELD_CLASS}>
                <label className={LABEL_CLASS} htmlFor="start_availability">
                  Start availability
                </label>
                <input
                  id="start_availability"
                  value={profile.start_availability}
                  onChange={(event) =>
                    updateTextField("start_availability", event.target.value)
                  }
                  className={INPUT_CLASS}
                  placeholder="Immediately, 2 weeks, 30 days"
                />
              </div>

              <div className={FIELD_CLASS}>
                <label className={LABEL_CLASS} htmlFor="relocation_preference">
                  Open to relocation
                </label>
                <select
                  id="relocation_preference"
                  value={profile.relocation_preference}
                  onChange={(event) => {
                    const nextValue = event.target.value;

                    if (isRelocationPreference(nextValue)) {
                      setProfile((current: ProfileFormData) => ({
                        ...current,
                        relocation_preference: nextValue,
                      }));
                    }
                  }}
                  className={SELECT_CLASS}>
                  {RELOCATION_OPTIONS.map((option) => (
                    <option key={option.value || "empty"} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className={FIELD_CLASS}>
                <label
                  className={LABEL_CLASS}
                  htmlFor="background_check_consent">
                  Background check
                </label>
                <select
                  id="background_check_consent"
                  value={profile.background_check_consent}
                  onChange={(event) => {
                    const nextValue = event.target.value;

                    if (isBackgroundCheckConsent(nextValue)) {
                      setProfile((current: ProfileFormData) => ({
                        ...current,
                        background_check_consent: nextValue,
                      }));
                    }
                  }}
                  className={SELECT_CLASS}>
                  {BACKGROUND_CHECK_OPTIONS.map((option) => (
                    <option key={option.value || "empty"} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className={FIELD_CLASS}>
                <label className={LABEL_CLASS} htmlFor="gender_identity">
                  Gender
                </label>
                <select
                  id="gender_identity"
                  value={profile.gender_identity}
                  onChange={(event) => {
                    const nextValue = event.target.value;

                    if (isGenderIdentity(nextValue)) {
                      setProfile((current: ProfileFormData) => ({
                        ...current,
                        gender_identity: nextValue,
                      }));
                    }
                  }}
                  className={SELECT_CLASS}>
                  {GENDER_OPTIONS.map((option) => (
                    <option key={option.value || "empty"} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className={FIELD_CLASS}>
                <label
                  className={LABEL_CLASS}
                  htmlFor="hispanic_latino_identity">
                  Hispanic/Latino
                </label>
                <select
                  id="hispanic_latino_identity"
                  value={profile.hispanic_latino_identity}
                  onChange={(event) => {
                    const nextValue = event.target.value;

                    if (isHispanicLatinoIdentity(nextValue)) {
                      setProfile((current: ProfileFormData) => ({
                        ...current,
                        hispanic_latino_identity: nextValue,
                      }));
                    }
                  }}
                  className={SELECT_CLASS}>
                  {HISPANIC_LATINO_OPTIONS.map((option) => (
                    <option key={option.value || "empty"} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className={FIELD_CLASS}>
                <label className={LABEL_CLASS} htmlFor="veteran_status">
                  Veteran status
                </label>
                <select
                  id="veteran_status"
                  value={profile.veteran_status}
                  onChange={(event) => {
                    const nextValue = event.target.value;

                    if (isVeteranStatus(nextValue)) {
                      setProfile((current: ProfileFormData) => ({
                        ...current,
                        veteran_status: nextValue,
                      }));
                    }
                  }}
                  className={SELECT_CLASS}>
                  {VETERAN_STATUS_OPTIONS.map((option) => (
                    <option key={option.value || "empty"} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className={FIELD_CLASS}>
                <label className={LABEL_CLASS} htmlFor="disability_status">
                  Disability status
                </label>
                <select
                  id="disability_status"
                  value={profile.disability_status}
                  onChange={(event) => {
                    const nextValue = event.target.value;

                    if (isDisabilityStatus(nextValue)) {
                      setProfile((current: ProfileFormData) => ({
                        ...current,
                        disability_status: nextValue,
                      }));
                    }
                  }}
                  className={SELECT_CLASS}>
                  {DISABILITY_STATUS_OPTIONS.map((option) => (
                    <option key={option.value || "empty"} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className={`${FIELD_CLASS} md:col-span-2`}>
                <label className={LABEL_CLASS} htmlFor="application_notes">
                  Application notes
                </label>
                <textarea
                  id="application_notes"
                  value={profile.application_notes}
                  onChange={(event) =>
                    updateTextField("application_notes", event.target.value)
                  }
                  className={TEXTAREA_CLASS}
                  placeholder="Optional context for recurring application questions the agent should answer truthfully."
                />
                <p className={HELPER_CLASS}>
                  Optional. Avoid secrets or one-off answers that only apply to
                  a single company.
                </p>
              </div>
            </div>
          </section>

          <section className={SECTION_CLASS}>
            <div className={SECTION_HEADER_CLASS}>
              <p className="text-sm text-accent-text">Step 6</p>
              <h2 className="mt-1 text-xl font-semibold text-text-primary">
                Resume evidence
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-text-secondary">
                Add structured work, project, and education details. JobPilot
                turns these entries into a grounded resume without inventing
                companies, dates, projects, or metrics.
              </p>
            </div>

            <div className="grid gap-8">
              <div className={EVIDENCE_GROUP_CLASS}>
                <div className={EVIDENCE_GROUP_HEADER_CLASS}>
                <div>
                  <p className="text-base font-medium text-text-primary">
                    Work experience
                  </p>
                  <p className={HELPER_CLASS}>
                    Include outcomes, metrics, technologies, and scope in the
                    bullet field.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addWorkEntry}
                  className={ACTION_BUTTON_CLASS}>
                  Add work
                </button>
                </div>

                <div className="grid gap-4">
                {workEntries.map((entry: WorkEntry, index: number) => (
                  <EvidenceEntryCard
                    key={entry.id}
                    title={getWorkEntryTitle(entry, index)}
                    meta={getWorkEntryMeta(entry)}
                    isExpanded={expandedEntryIds.includes(entry.id)}
                    canRemove={workEntries.length > 1}
                    onToggle={() => toggleEntry(entry.id)}
                    onRemove={() => removeWorkEntry(entry.id)}>
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className={FIELD_CLASS}>
                        <label
                          className={LABEL_CLASS}
                          htmlFor={`${entry.id}-company`}>
                          Company
                        </label>
                        <input
                          id={`${entry.id}-company`}
                          value={entry.company}
                          onChange={(event) =>
                            updateWorkEntry(
                              entry.id,
                              "company",
                              event.target.value,
                            )
                          }
                          className={INPUT_CLASS}
                          placeholder="Acme Labs"
                        />
                      </div>

                      <div className={FIELD_CLASS}>
                        <label
                          className={LABEL_CLASS}
                          htmlFor={`${entry.id}-role`}>
                          Role
                        </label>
                        <input
                          id={`${entry.id}-role`}
                          value={entry.role}
                          onChange={(event) =>
                            updateWorkEntry(
                              entry.id,
                              "role",
                              event.target.value,
                            )
                          }
                          className={INPUT_CLASS}
                          placeholder="Frontend engineer"
                        />
                      </div>

                      <div className={FIELD_CLASS}>
                        <label
                          className={LABEL_CLASS}
                          htmlFor={`${entry.id}-dates`}>
                          Dates
                        </label>
                        <input
                          id={`${entry.id}-dates`}
                          value={entry.dates}
                          onChange={(event) =>
                            updateWorkEntry(
                              entry.id,
                              "dates",
                              event.target.value,
                            )
                          }
                          className={INPUT_CLASS}
                          placeholder="2022 - Present"
                        />
                      </div>
                    </div>

                    <div className={FIELD_CLASS}>
                      <label
                        className={LABEL_CLASS}
                        htmlFor={`${entry.id}-bullets`}>
                        Impact bullets
                      </label>
                      <textarea
                        id={`${entry.id}-bullets`}
                        value={entry.bullets}
                        onChange={(event) =>
                          updateWorkEntry(
                            entry.id,
                            "bullets",
                            event.target.value,
                          )
                        }
                        className={TEXTAREA_CLASS}
                        placeholder="Shipped a React dashboard used by 12K users&#10;Reduced page load time by 35% with code splitting"
                      />
                    </div>
                  </EvidenceEntryCard>
                ))}
                </div>
              </div>

              <div className={EVIDENCE_GROUP_CLASS}>
                <div className={EVIDENCE_GROUP_HEADER_CLASS}>
                <div>
                  <p className="text-base font-medium text-text-primary">
                    Projects
                  </p>
                  <p className={HELPER_CLASS}>
                    Add portfolio, side, open source, or production projects
                    that support your target role.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addProjectEntry}
                  className={ACTION_BUTTON_CLASS}>
                  Add project
                </button>
                </div>

                <div className="grid gap-4">
                {projectEntries.map((entry: ProjectEntry, index: number) => (
                  <EvidenceEntryCard
                    key={entry.id}
                    title={getProjectEntryTitle(entry, index)}
                    meta={getProjectEntryMeta(entry)}
                    isExpanded={expandedEntryIds.includes(entry.id)}
                    canRemove={projectEntries.length > 1}
                    onToggle={() => toggleEntry(entry.id)}
                    onRemove={() => removeProjectEntry(entry.id)}>
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className={FIELD_CLASS}>
                        <label
                          className={LABEL_CLASS}
                          htmlFor={`${entry.id}-name`}>
                          Project name
                        </label>
                        <input
                          id={`${entry.id}-name`}
                          value={entry.name}
                          onChange={(event) =>
                            updateProjectEntry(
                              entry.id,
                              "name",
                              event.target.value,
                            )
                          }
                          className={INPUT_CLASS}
                          placeholder="JobPilot"
                        />
                      </div>

                      <div className={FIELD_CLASS}>
                        <label
                          className={LABEL_CLASS}
                          htmlFor={`${entry.id}-link`}>
                          Link
                        </label>
                        <input
                          id={`${entry.id}-link`}
                          value={entry.link}
                          onChange={(event) =>
                            updateProjectEntry(
                              entry.id,
                              "link",
                              event.target.value,
                            )
                          }
                          className={INPUT_CLASS}
                          placeholder="https://github.com/you/project"
                        />
                      </div>

                      <div className={FIELD_CLASS}>
                        <label
                          className={LABEL_CLASS}
                          htmlFor={`${entry.id}-stack`}>
                          Stack
                        </label>
                        <input
                          id={`${entry.id}-stack`}
                          value={entry.stack}
                          onChange={(event) =>
                            updateProjectEntry(
                              entry.id,
                              "stack",
                              event.target.value,
                            )
                          }
                          className={INPUT_CLASS}
                          placeholder="Next.js, TypeScript, InsForge"
                        />
                      </div>
                    </div>

                    <div className={FIELD_CLASS}>
                      <label
                        className={LABEL_CLASS}
                        htmlFor={`${entry.id}-project-bullets`}>
                        Project bullets
                      </label>
                      <textarea
                        id={`${entry.id}-project-bullets`}
                        value={entry.bullets}
                        onChange={(event) =>
                          updateProjectEntry(
                            entry.id,
                            "bullets",
                            event.target.value,
                          )
                        }
                        className={TEXTAREA_CLASS}
                        placeholder="Built an AI-powered job application workflow&#10;Integrated OAuth, profile storage, and PDF resume generation"
                      />
                    </div>
                  </EvidenceEntryCard>
                ))}
                </div>
              </div>

              <div className={EVIDENCE_GROUP_CLASS}>
                <div className={EVIDENCE_GROUP_HEADER_CLASS}>
                <div>
                  <p className="text-base font-medium text-text-primary">
                    Education and certifications
                  </p>
                  <p className={HELPER_CLASS}>
                    Include degrees, bootcamps, certificates, and relevant
                    coursework.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addEducationEntry}
                  className={ACTION_BUTTON_CLASS}>
                  Add education
                </button>
                </div>

                <div className="grid gap-4">
                {educationEntries.map(
                  (entry: EducationEntry, index: number) => (
                    <EvidenceEntryCard
                      key={entry.id}
                      title={getEducationEntryTitle(entry, index)}
                      meta={getEducationEntryMeta(entry)}
                      isExpanded={expandedEntryIds.includes(entry.id)}
                      canRemove={educationEntries.length > 1}
                      onToggle={() => toggleEntry(entry.id)}
                      onRemove={() => removeEducationEntry(entry.id)}>
                      <div className="grid gap-4 md:grid-cols-3">
                        <div className={FIELD_CLASS}>
                          <label
                            className={LABEL_CLASS}
                            htmlFor={`${entry.id}-school`}>
                            School or program
                          </label>
                          <input
                            id={`${entry.id}-school`}
                            value={entry.school}
                            onChange={(event) =>
                              updateEducationEntry(
                                entry.id,
                                "school",
                                event.target.value,
                              )
                            }
                            className={INPUT_CLASS}
                            placeholder="State University"
                          />
                        </div>

                        <div className={FIELD_CLASS}>
                          <label
                            className={LABEL_CLASS}
                            htmlFor={`${entry.id}-credential`}>
                            Credential
                          </label>
                          <input
                            id={`${entry.id}-credential`}
                            value={entry.credential}
                            onChange={(event) =>
                              updateEducationEntry(
                                entry.id,
                                "credential",
                                event.target.value,
                              )
                            }
                            className={INPUT_CLASS}
                            placeholder="B.S. Computer Science"
                          />
                        </div>

                        <div className={FIELD_CLASS}>
                          <label
                            className={LABEL_CLASS}
                            htmlFor={`${entry.id}-education-dates`}>
                            Dates
                          </label>
                          <input
                            id={`${entry.id}-education-dates`}
                            value={entry.dates}
                            onChange={(event) =>
                              updateEducationEntry(
                                entry.id,
                                "dates",
                                event.target.value,
                              )
                            }
                            className={INPUT_CLASS}
                            placeholder="2018 - 2022"
                          />
                        </div>
                      </div>

                      <div className={FIELD_CLASS}>
                        <label
                          className={LABEL_CLASS}
                          htmlFor={`${entry.id}-notes`}>
                          Notes
                        </label>
                        <textarea
                          id={`${entry.id}-notes`}
                          value={entry.notes}
                          onChange={(event) =>
                            updateEducationEntry(
                              entry.id,
                              "notes",
                              event.target.value,
                            )
                          }
                          className={TEXTAREA_CLASS}
                          placeholder="Relevant coursework, certification issuer, honors, or focus area"
                        />
                      </div>
                    </EvidenceEntryCard>
                  ),
                )}
                </div>
              </div>
            </div>
          </section>

          {result?.success ? (
            <div className="rounded-2xl border border-state-success/20 bg-state-success-dim p-4">
              <p className="text-sm font-medium text-state-success">
                {isEditingSavedProfile ? "Profile updated." : "Profile saved."}
              </p>
            </div>
          ) : null}

          {result && !result.success && result.error ? (
            <div className="rounded-2xl border border-state-error/20 bg-state-error-dim p-4">
              <p className="text-sm font-medium text-state-error">
                {result.error}
              </p>
            </div>
          ) : null}

          <section className="border-t border-default pt-6">
            <div className="flex flex-col gap-4 rounded-2xl border border-default bg-surface p-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-medium text-text-primary">
                  Resume PDF
                </p>
                <p className="mt-1 text-xs text-text-muted">{resumeHelpText}</p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
                {resumeUrl ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setIsResumePreviewOpen(true)}
                      className="inline-flex h-10 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-default bg-elevated px-4 text-sm font-medium text-text-secondary transition-colors hover:border-subtle hover:bg-subtle hover:text-text-primary">
                      <Eye className="h-4 w-4" aria-hidden="true" />
                      Preview
                    </button>
                    <a
                      href="/api/resume/download"
                      className="inline-flex h-10 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-default bg-elevated px-4 text-sm font-medium text-text-secondary transition-colors hover:border-subtle hover:bg-subtle hover:text-text-primary">
                      <Download className="h-4 w-4" aria-hidden="true" />
                      Download
                    </a>
                  </>
                ) : null}
                <button
                  type="button"
                  onClick={handleGenerateResume}
                  disabled={!canGenerateResume || isGeneratingResume}
                  aria-describedby={
                    shouldShowResumeBlockers
                      ? "resume-generation-blockers"
                      : undefined
                  }
                  className="inline-flex h-10 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-accent-primary px-4 text-sm font-medium text-bg-base transition-colors hover:bg-accent-hover hover:shadow-accent disabled:cursor-not-allowed disabled:opacity-70">
                  {resumeUrl && !isGeneratingResume ? (
                    <RefreshCcw className="h-4 w-4" aria-hidden="true" />
                  ) : null}
                  {isGeneratingResume
                    ? "Generating..."
                    : resumeUrl
                      ? "Regenerate"
                      : "Generate resume"}
                </button>
              </div>
            </div>

            {!resumeUrl ? (
              <div className="mt-4 flex flex-col items-center justify-center gap-3 px-5 py-12 text-center">
                <p className="text-base font-medium text-text-muted">
                  No resume generated yet
                </p>
                <p className="max-w-sm text-sm leading-6 text-text-faint">
                  Once your saved profile has enough evidence, JobPilot will
                  render a private PDF preview here.
                </p>
              </div>
            ) : null}

            {shouldShowResumeBlockers ? (
              <div
                id="resume-generation-blockers"
                className="mt-4 rounded-2xl border border-state-warning/20 bg-state-warning-dim p-4">
                <p className="text-sm font-medium text-state-warning">
                  You need to address the following before generating your
                  resume:
                </p>
                <ul className="mt-2 grid gap-1 text-xs text-text-secondary">
                  {resumeBlockers.map((blocker: string) => (
                    <li key={blocker}>{blocker}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {resumeResult?.success ? (
              <div className="mt-4 rounded-2xl border border-state-success/20 bg-state-success-dim p-4">
                <p className="text-sm font-medium text-state-success">
                  Resume generated. Download it whenever you need it.
                </p>
              </div>
            ) : null}

            {resumeResult && !resumeResult.success && resumeResult.error ? (
              <div className="mt-4 rounded-2xl border border-state-error/20 bg-state-error-dim p-4">
                <p className="text-sm font-medium text-state-error">
                  {resumeResult.error}
                </p>
              </div>
            ) : null}

          </section>

          <div className="flex flex-col gap-3 border-t border-default pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-text-muted">
              Saved profile details are used for resume generation.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              {result?.success && isProfileComplete ? (
                <Link
                  href="/dashboard"
                  className="inline-flex h-9 items-center justify-center rounded-xl border border-default bg-elevated px-4 text-sm font-medium text-text-secondary transition-colors hover:border-subtle hover:bg-subtle hover:text-text-primary">
                  Go to dashboard
                </Link>
              ) : null}
              <button
                type="submit"
                disabled={isPending}
                className="h-9 rounded-xl bg-accent-primary px-4 text-sm font-medium text-bg-base transition-colors hover:bg-accent-hover hover:shadow-accent disabled:cursor-not-allowed disabled:opacity-70">
                {isPending
                  ? "Saving..."
                  : isEditingSavedProfile
                    ? "Update profile"
                    : "Save profile"}
              </button>
            </div>
          </div>
        </div>
      </form>
      {isResumePreviewOpen && resumeUrl ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-overlay p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="resume-preview-title">
          <button
            type="button"
            aria-label="Close resume preview"
            className="absolute inset-0 cursor-default"
            onClick={() => setIsResumePreviewOpen(false)}
          />
          <div className="relative flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-default bg-surface shadow-elevated">
            <div className="flex items-center justify-between gap-4 border-b border-default px-5 py-4">
              <div>
                <p className="text-sm text-accent-text">Resume preview</p>
                <h2
                  id="resume-preview-title"
                  className="mt-1 text-xl font-semibold text-text-primary">
                  Generated resume PDF
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsResumePreviewOpen(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-text-muted transition-colors hover:bg-subtle hover:text-text-secondary"
                aria-label="Close resume preview">
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            <iframe
              key={resumePreviewSrc}
              src={resumePreviewSrc}
              title="Generated resume preview"
              className="h-[72vh] w-full border-0 bg-base"
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
