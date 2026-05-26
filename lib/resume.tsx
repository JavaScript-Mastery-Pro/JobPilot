import "server-only";

import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
  renderToBuffer,
} from "@react-pdf/renderer";
import OpenAI from "openai";
import type { ReactElement } from "react";

export const BASE_RESUME_PATH_PREFIX = "resumes";
export const BASE_RESUME_FILE_NAME = "resume.pdf";

export type ResumeProfile = {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  targetRole: string;
  experienceLevel: string;
  yearsExperience: number;
  skills: string[];
  remotePreference: string;
  linkedinUrl: string;
  portfolioUrl: string;
  workExperience: string;
  projects: string;
  education: string;
  achievements: string;
};

type ResumeEntry = {
  title: string;
  organization: string;
  dates: string;
  bullets: string[];
};

type ResumeContent = {
  headline: string;
  summary: string;
  coreSkills: string[];
  experience: ResumeEntry[];
  projects: ResumeEntry[];
  education: string[];
};

export type TailoredResumeJob = {
  title: string;
  company: string;
  location: string;
  description: string;
  matchScore: number;
  matchReason: string;
};

const styles = StyleSheet.create({
  page: {
    padding: 34,
    fontFamily: "Helvetica",
    fontSize: 9,
  },
  header: {
    marginBottom: 14,
  },
  name: {
    fontSize: 21,
    marginBottom: 4,
  },
  headline: {
    fontSize: 11,
    marginBottom: 7,
  },
  contactLine: {
    fontSize: 8,
    marginBottom: 3,
  },
  section: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 10,
    marginBottom: 5,
  },
  paragraph: {
    marginBottom: 4,
  },
  entry: {
    marginBottom: 7,
  },
  entryHeader: {
    fontSize: 9,
    marginBottom: 2,
  },
  entryMeta: {
    fontSize: 8,
    marginBottom: 3,
  },
  bulletRow: {
    flexDirection: "row",
    marginBottom: 3,
  },
  bullet: {
    width: 9,
  },
  bulletText: {
    flexDirection: "column",
    width: "95%",
  },
});

function getBaseResumePath(userId: string): string {
  return `${BASE_RESUME_PATH_PREFIX}/${userId}/${BASE_RESUME_FILE_NAME}`;
}

function getTailoredResumePath(userId: string, jobId: string): string {
  return `${BASE_RESUME_PATH_PREFIX}/${userId}/${jobId}.pdf`;
}

function getOpenAIClient(): OpenAI {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("Missing OPENAI_API_KEY.");
  }

  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

function getStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item: unknown): item is string => typeof item === "string")
    .map((item: string) => item.trim())
    .filter(Boolean);
}

function isResumeEntry(value: unknown): value is ResumeEntry {
  if (value === null || typeof value !== "object") {
    return false;
  }

  return (
    "title" in value &&
    typeof value.title === "string" &&
    "organization" in value &&
    typeof value.organization === "string" &&
    "dates" in value &&
    typeof value.dates === "string" &&
    "bullets" in value &&
    getStringArray(value.bullets).length > 0
  );
}

function getResumeEntries(value: unknown): ResumeEntry[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((entry: unknown): entry is ResumeEntry => isResumeEntry(entry))
    .map((entry: ResumeEntry) => ({
      title: entry.title.trim(),
      organization: entry.organization.trim(),
      dates: entry.dates.trim(),
      bullets: getStringArray(entry.bullets).slice(0, 4),
    }))
    .filter(
      (entry: ResumeEntry) =>
        entry.title.length > 0 && entry.bullets.length > 0,
    );
}

function isResumeContent(value: unknown): value is ResumeContent {
  if (value === null || typeof value !== "object") {
    return false;
  }

  if (
    !("headline" in value) ||
    !("summary" in value) ||
    !("coreSkills" in value) ||
    !("experience" in value) ||
    !("projects" in value) ||
    !("education" in value)
  ) {
    return false;
  }

  return (
    typeof value.headline === "string" &&
    typeof value.summary === "string" &&
    getStringArray(value.coreSkills).length > 0 &&
    (getResumeEntries(value.experience).length > 0 ||
      getResumeEntries(value.projects).length > 0)
  );
}

function normalizeResumeContent(value: ResumeContent): ResumeContent {
  return {
    headline: value.headline.trim(),
    summary: value.summary.trim(),
    coreSkills: getStringArray(value.coreSkills).slice(0, 18),
    experience: getResumeEntries(value.experience).slice(0, 3),
    projects: getResumeEntries(value.projects).slice(0, 3),
    education: getStringArray(value.education).slice(0, 4),
  };
}

function ResumeBullet({
  children,
}: {
  children: string | ReactElement | Array<string | ReactElement>;
}): ReactElement {
  return (
    <View style={styles.bulletRow}>
      <Text style={styles.bullet}>-</Text>
      <Text style={styles.bulletText}>{children}</Text>
    </View>
  );
}

function ResumeSection({
  title,
  children,
}: {
  title: string;
  children: ReactElement | ReactElement[];
}): ReactElement {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function ResumeEntryBlock({ entry }: { entry: ResumeEntry }): ReactElement {
  const meta = [entry.organization, entry.dates].filter(Boolean).join(" | ");

  return (
    <View style={styles.entry}>
      <Text style={styles.entryHeader}>{entry.title}</Text>
      {meta ? <Text style={styles.entryMeta}>{meta}</Text> : null}
      {entry.bullets.map((bullet: string) => (
        <ResumeBullet key={bullet}>{bullet}</ResumeBullet>
      ))}
    </View>
  );
}

function ResumeDocument({
  profile,
  content,
}: {
  profile: ResumeProfile;
  content: ResumeContent;
}): ReactElement {
  const links = [profile.linkedinUrl, profile.portfolioUrl].filter(Boolean);

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.name}>{profile.fullName}</Text>
          <Text style={styles.headline}>{content.headline}</Text>
          <Text style={styles.contactLine}>
            {profile.email} | {profile.phone} | {profile.location}
          </Text>
          {links.length > 0 ? (
            <Text style={styles.contactLine}>{links.join(" | ")}</Text>
          ) : null}
        </View>

        <ResumeSection title="Summary">
          <Text style={styles.paragraph}>{content.summary}</Text>
        </ResumeSection>

        <ResumeSection title="Skills">
          <Text style={styles.paragraph}>{content.coreSkills.join(" | ")}</Text>
        </ResumeSection>

        {content.experience.length > 0 ? (
          <ResumeSection title="Experience">
            {content.experience.map((entry: ResumeEntry) => (
              <ResumeEntryBlock
                key={`${entry.title}-${entry.organization}-${entry.dates}`}
                entry={entry}
              />
            ))}
          </ResumeSection>
        ) : null}

        {content.projects.length > 0 ? (
          <ResumeSection title="Projects">
            {content.projects.map((entry: ResumeEntry) => (
              <ResumeEntryBlock
                key={`${entry.title}-${entry.organization}-${entry.dates}`}
                entry={entry}
              />
            ))}
          </ResumeSection>
        ) : null}

        {content.education.length > 0 ? (
          <ResumeSection title="Education and Certifications">
            {content.education.map((item: string) => (
              <ResumeBullet key={item}>{item}</ResumeBullet>
            ))}
          </ResumeSection>
        ) : null}

        <ResumeSection title="Target">
          <ResumeBullet>
            Seeking {profile.remotePreference} {profile.targetRole} roles at the{" "}
            {profile.experienceLevel} level.
          </ResumeBullet>
        </ResumeSection>
      </Page>
    </Document>
  );
}

function getGenerationInput(profile: ResumeProfile): object {
  return {
    contact: {
      name: profile.fullName,
      email: profile.email,
      phone: profile.phone,
      location: profile.location,
      linkedinUrl: profile.linkedinUrl,
      portfolioUrl: profile.portfolioUrl,
    },
    target: {
      role: profile.targetRole,
      level: profile.experienceLevel,
      yearsExperience: profile.yearsExperience,
      remotePreference: profile.remotePreference,
    },
    skills: profile.skills,
    evidence: {
      workExperience: profile.workExperience,
      projects: profile.projects,
      education: profile.education,
      achievements: profile.achievements,
    },
  };
}

function getTailoringInput(
  profile: ResumeProfile,
  job: TailoredResumeJob,
): object {
  return {
    profile: getGenerationInput(profile),
    job: {
      title: job.title,
      company: job.company,
      location: job.location,
      description: job.description,
      matchScore: job.matchScore,
      matchReason: job.matchReason,
    },
  };
}

export function getBaseResumePathForUser(userId: string): string {
  return getBaseResumePath(userId);
}

export function getTailoredResumePathForJob(
  userId: string,
  jobId: string,
): string {
  return getTailoredResumePath(userId, jobId);
}

export function hasEnoughResumeEvidence(profile: ResumeProfile): boolean {
  return [
    profile.workExperience,
    profile.projects,
    profile.education,
    profile.achievements,
  ].join(" ").trim().length >= 160;
}

export async function generateResumeContent(
  profile: ResumeProfile,
): Promise<ResumeContent> {
  const openai = getOpenAIClient();
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    response_format: { type: "json_object" },
    temperature: 0.7,
    max_tokens: 800,
    messages: [
      {
        role: "system",
        content:
          "You are an expert technical resume writer. Return only valid JSON with keys headline, summary, coreSkills, experience, projects, and education. Use only facts present in the provided evidence. Do not invent employers, dates, education, certifications, metrics, projects, or technologies. Rewrite weak phrasing into sharp resume bullets, but keep every claim grounded.",
      },
      {
        role: "user",
        content: JSON.stringify({
          task: "Create an application-quality one-page ATS resume from this saved profile evidence.",
          profile: getGenerationInput(profile),
          requirements: {
            headline: "Specific target-role headline, not generic.",
            summary: "Two concise sentences grounded in evidence.",
            coreSkills: "Array of 10 to 18 ATS keywords from provided skills/evidence.",
            experience:
              "Array of role entries with title, organization, dates, and 2-4 strong bullets. If organization or dates are absent, use empty strings, never invented values.",
            projects:
              "Array of project entries with title, organization as empty string unless provided, dates as empty string unless provided, and 2-4 bullets.",
            education:
              "Array of education/certification lines only when provided.",
          },
        }),
      },
    ],
  });

  const content = response.choices[0]?.message.content;

  if (typeof content !== "string" || !content.trim()) {
    throw new Error("OpenAI returned empty resume content.");
  }

  const parsed: unknown = JSON.parse(content);

  if (!isResumeContent(parsed)) {
    throw new Error("OpenAI returned invalid resume content.");
  }

  return normalizeResumeContent(parsed);
}

export async function generateTailoredResumeContent(
  profile: ResumeProfile,
  job: TailoredResumeJob,
): Promise<ResumeContent> {
  const openai = getOpenAIClient();
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    response_format: { type: "json_object" },
    temperature: 0.7,
    max_tokens: 800,
    messages: [
      {
        role: "system",
        content:
          "You are an expert technical resume writer tailoring a resume for one specific job. Return only valid JSON with keys headline, summary, coreSkills, experience, projects, and education. Use only facts present in the profile evidence. Do not invent employers, dates, education, certifications, metrics, projects, or technologies. Emphasize evidence that matches the job description and match reason.",
      },
      {
        role: "user",
        content: JSON.stringify({
          task: "Create a one-page ATS resume tailored to this specific job while staying fully grounded in the saved profile evidence.",
          input: getTailoringInput(profile, job),
          requirements: {
            headline:
              "Specific headline aligned to the target job title and company context.",
            summary:
              "Two concise sentences connecting grounded candidate evidence to the job's needs.",
            coreSkills:
              "Array of 10 to 18 ATS keywords prioritized from provided skills/evidence and the job description.",
            experience:
              "Array of role entries with title, organization, dates, and 2-4 tailored bullets. If organization or dates are absent, use empty strings, never invented values.",
            projects:
              "Array of project entries with title, organization as empty string unless provided, dates as empty string unless provided, and 2-4 tailored bullets.",
            education:
              "Array of education/certification lines only when provided.",
          },
        }),
      },
    ],
  });

  const content = response.choices[0]?.message.content;

  if (typeof content !== "string" || !content.trim()) {
    throw new Error("OpenAI returned empty tailored resume content.");
  }

  const parsed: unknown = JSON.parse(content);

  if (!isResumeContent(parsed)) {
    throw new Error("OpenAI returned invalid tailored resume content.");
  }

  return normalizeResumeContent(parsed);
}

export async function renderResumePdf(
  profile: ResumeProfile,
  content: ResumeContent,
): Promise<Buffer> {
  return renderToBuffer(<ResumeDocument profile={profile} content={content} />);
}
