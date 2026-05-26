import type { ProfileFormData } from "@/types";

type RequiredField = {
  key: keyof ProfileFormData;
  label: string;
};

export const REQUIRED_PROFILE_FIELDS: RequiredField[] = [
  { key: "first_name", label: "First name" },
  { key: "last_name", label: "Last name" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
  { key: "location", label: "Location" },
  { key: "job_title", label: "Target role" },
  { key: "experience_level", label: "Experience level" },
  { key: "years_experience", label: "Years of experience" },
  { key: "skills", label: "Skills" },
  { key: "remote_preference", label: "Work preference" },
  { key: "cover_letter_tone", label: "Cover letter tone" },
];

type Props = {
  profile: ProfileFormData;
};

function isFieldFilled(profile: ProfileFormData, key: keyof ProfileFormData): boolean {
  const value = profile[key];

  if (Array.isArray(value)) {
    return value.length > 0;
  }

  if (typeof value === "number") {
    return Number.isInteger(value) && value >= 0;
  }

  return value.trim().length > 0;
}

export function getMissingProfileFields(profile: ProfileFormData): RequiredField[] {
  return REQUIRED_PROFILE_FIELDS.filter(
    (field: RequiredField) => !isFieldFilled(profile, field.key),
  );
}

export function CompletionIndicator({ profile }: Props) {
  const missingFields = getMissingProfileFields(profile);
  const completedCount = REQUIRED_PROFILE_FIELDS.length - missingFields.length;
  const isComplete = missingFields.length === 0;
  const segments = REQUIRED_PROFILE_FIELDS.map(
    (field: RequiredField, index: number) => ({
      key: field.key,
      isFilled: index < completedCount,
    }),
  );

  return (
    <aside className="rounded-2xl border border-default bg-surface">
      <div className="border-b border-default px-5 py-4">
        <p className="text-sm font-medium text-text-primary">
          Profile completion
        </p>
        <p className="mt-1 text-xs text-text-muted">
          {completedCount} of {REQUIRED_PROFILE_FIELDS.length} required fields
        </p>
      </div>
      <div className="p-5">
        <div className="grid grid-cols-10 gap-1">
          {segments.map((segment) => (
            <div
              key={segment.key}
              className={
                segment.isFilled
                  ? "h-1.5 rounded-full bg-accent-primary"
                  : "h-1.5 rounded-full bg-subtle"
              }
            />
          ))}
        </div>

        <div
          className={
            isComplete
              ? "mt-5 rounded-2xl border border-state-success/20 bg-state-success-dim p-4"
              : "mt-5 rounded-2xl border border-state-warning/20 bg-state-warning-dim p-4"
          }
        >
          <p
            className={
              isComplete
                ? "text-sm font-medium text-state-success"
                : "text-sm font-medium text-state-warning"
            }
          >
            {isComplete ? "Ready for the agent" : "Missing details"}
          </p>
          <p className="mt-1 text-xs leading-5 text-text-secondary">
            {isComplete
              ? "Your core profile fields are complete."
              : "Fill the remaining core fields before running JobPilot."}
          </p>
        </div>

        {!isComplete ? (
          <ul className="mt-5 flex flex-col gap-2">
            {missingFields.map((field: RequiredField) => (
              <li
                key={field.key}
                className="flex items-center justify-between gap-3 rounded-xl border border-default bg-elevated px-3 py-2"
              >
                <span className="text-sm text-text-secondary">{field.label}</span>
                <span className="text-xs text-text-muted">Required</span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </aside>
  );
}
