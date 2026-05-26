export type ExperienceLevel = "junior" | "mid" | "senior" | "lead";

export type RemotePreference = "remote" | "onsite" | "hybrid" | "any";

export type CoverLetterTone = "formal" | "casual" | "enthusiastic";

export type WorkAuthorization =
  | ""
  | "authorized"
  | "not_authorized"
  | "prefer_not_to_answer";

export type SponsorshipRequirement =
  | ""
  | "no"
  | "yes_now"
  | "yes_future"
  | "prefer_not_to_answer";

export type RelocationPreference =
  | ""
  | "yes"
  | "no"
  | "open"
  | "prefer_not_to_answer";

export type BackgroundCheckConsent = "" | "yes" | "no" | "prefer_not_to_answer";

export type GenderIdentity =
  | ""
  | "female"
  | "male"
  | "non_binary"
  | "self_describe"
  | "prefer_not_to_answer";

export type HispanicLatinoIdentity = "" | "yes" | "no" | "prefer_not_to_answer";

export type VeteranStatus =
  | ""
  | "protected_veteran"
  | "not_protected_veteran"
  | "not_veteran"
  | "prefer_not_to_answer";

export type DisabilityStatus = "" | "yes" | "no" | "prefer_not_to_answer";

export type ProfileFormData = {
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  phone: string;
  location: string;
  job_title: string;
  experience_level: ExperienceLevel;
  years_experience: number;
  skills: string[];
  remote_preference: RemotePreference;
  cover_letter_tone: CoverLetterTone;
  linkedin_url: string;
  portfolio_url: string;
  resume_work_experience: string;
  resume_projects: string;
  resume_education: string;
  resume_achievements: string;
  work_authorization: WorkAuthorization;
  sponsorship_requirement: SponsorshipRequirement;
  salary_expectation: string;
  start_availability: string;
  relocation_preference: RelocationPreference;
  background_check_consent: BackgroundCheckConsent;
  gender_identity: GenderIdentity;
  hispanic_latino_identity: HispanicLatinoIdentity;
  veteran_status: VeteranStatus;
  disability_status: DisabilityStatus;
  application_notes: string;
};

export type ProfileValidationErrors = Partial<
  Record<keyof ProfileFormData, string>
>;

export type ProfileSaveResult = {
  success: boolean;
  error?: string;
  fieldErrors?: ProfileValidationErrors;
};

export type ResumeGenerateResult = {
  success: boolean;
  data?: {
    resumeUrl: string;
  };
  error?: string;
};

export type ResumeTailorResult = {
  success: boolean;
  data?: {
    resumeUrl: string;
  };
  error?: string;
};

export type ManualApplyResult = {
  success: boolean;
  data?: {
    applied: boolean;
  };
  error?: string;
};

export type ReviewJob = {
  id: string;
  title: string;
  company: string;
  location: string;
  externalApplyUrl: string;
  matchScore: number;
  matchReason: string;
  foundAt: string;
};

export type DashboardActiveRun = {
  id: string;
  status: string;
  jobTitle: string;
  location: string;
  startedAt: string;
  browserbaseSessionId: string;
  browserbaseRecordingUrl: string;
};

export type DashboardSessionRecording = {
  runId: string;
  status: string;
  jobTitle: string;
  location: string;
  startedAt: string;
  browserbaseSessionId: string;
  browserbaseRecordingUrl: string;
  isActive: boolean;
};

export type DashboardStats = {
  totalFound: number;
  autoApplied: number;
  manuallyApplied: number;
  matchRate: number;
  successRate: number;
};

export type DashboardRunSummary = {
  id: string;
  status: string;
  jobTitle: string;
  location: string;
  startedAt: string;
  completedAt: string;
  jobsFound: number;
  jobsMatched: number;
  jobsApplied: number;
  jobsFailed: number;
};

export type DashboardAppliedJobStatus = "applied" | "failed";

export type DashboardAppliedJob = {
  id: string;
  title: string;
  company: string;
  matchScore: number;
  status: DashboardAppliedJobStatus;
  appliedAt: string;
  coverLetter: string;
  externalApplyUrl: string;
  errorMessage: string;
};

export type JobInventoryStatus =
  | "found"
  | "queued"
  | "applying"
  | "needs_input"
  | "applied"
  | "failed"
  | "dismissed";

export type JobInventoryDisplayStatus = "applied" | "not_applied";

export type JobInventoryApplyType =
  | "external_link_apply"
  | "easy_apply"
  | "unknown";

export type JobInventoryItem = {
  id: string;
  title: string;
  company: string;
  location: string;
  status: JobInventoryStatus;
  displayStatus: JobInventoryDisplayStatus;
  applyType: JobInventoryApplyType;
  matchScore: number;
  matchReason: string;
  foundAt: string;
  appliedAt: string;
  sourceUrl: string;
  coverLetter: string;
  externalApplyUrl: string;
  errorMessage: string;
  isTailored: boolean;
};

export type JobsWorkspaceRun = DashboardRunSummary & {
  isActive: boolean;
};

export type AgentLogLevel = "info" | "success" | "warning" | "error";

export type DashboardAgentLog = {
  id: string;
  runId: string;
  level: AgentLogLevel;
  message: string;
  jobId: string;
  createdAt: string;
};

export type AgentFindResult = {
  success: boolean;
  data?: {
    runId: string;
    savedJobs: number;
    skippedJobs: number;
    matchedJobs: number;
    reviewJobs: number;
    failedMatches: number;
    generatedCoverLetters: number;
    failedCoverLetters: number;
    recordingUrl: string;
  };
  error?: string;
};

export type AgentStopResult = {
  success: boolean;
  data?: {
    stopped: boolean;
    runId?: string;
  };
  error?: string;
};

export type JobDetails = ReviewJob & {
  description: string;
  sourceUrl: string;
  status: string;
  resumeUrl: string;
  isTailored: boolean;
  coverLetter: string;
  appliedAt: string;
  errorMessage: string;
  hasBaseResume: boolean;
  isEasyApply: boolean;
  linkedinConnected: boolean;
};

export type JobActionResult = {
  success: boolean;
  error?: string;
};
