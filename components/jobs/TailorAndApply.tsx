"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  CheckCircle2,
  FlaskConical,
  FilePenLine,
  LockKeyhole,
  SendHorizontal,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { ManualApplyResult, ResumeTailorResult } from "@/types";

type TailorAndApplyProps = {
  jobId: string;
  hasBaseResume: boolean;
  isTailored: boolean;
  status: string;
  isEasyApply: boolean;
  linkedinConnected: boolean;
};

export function TailorAndApply({
  jobId,
  hasBaseResume,
  isTailored,
  status,
  isEasyApply,
  linkedinConnected,
}: TailorAndApplyProps) {
  const router = useRouter();
  const [isTailoring, setIsTailoring] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [wasTailored, setWasTailored] = useState(isTailored);
  const canApplyStatus = status === "found" || status === "failed";
  const helperText = isEasyApply
    ? !linkedinConnected
      ? "Connect your LinkedIn account on the profile page before running the Easy Apply attempt."
      : canApplyStatus
        ? "Run the LinkedIn Easy Apply path using your saved profile. This is an experimental Browserbase attempt — it may stop or misfill fields."
        : "This job cannot run the apply attempt from its current status."
    : hasBaseResume
      ? wasTailored
        ? canApplyStatus
          ? "Run the current Browserbase automation path exactly as-is so reviewers can inspect where it succeeds, blocks, or misfills fields."
          : "This job cannot run the apply attempt from its current status."
        : "You can tailor the resume for a better application package, or run the Browserbase apply attempt now with your base resume."
      : "Generate your base resume on the profile page before tailoring it for this job.";
  const canTailor = !isEasyApply && hasBaseResume && !isTailoring;
  const canApply =
    canApplyStatus &&
    !isApplying &&
    !isTailoring &&
    (isEasyApply ? linkedinConnected : hasBaseResume);

  function handleTailor(): void {
    if (!canTailor) {
      return;
    }

    setError("");
    setSuccessMessage("");
    void tailorResume();
  }

  function handleApply(): void {
    if (!canApply) {
      return;
    }

    setError("");
    setSuccessMessage("");
    void applyManually();
  }

  async function tailorResume(): Promise<void> {
    try {
      setIsTailoring(true);
      const response = await fetch("/api/resume/tailor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ jobId }),
      });
      const result: unknown = await response.json();

      if (!isResumeTailorResult(result) || !result.success) {
        setError(
          isResumeTailorResult(result) && result.error
            ? result.error
            : "Could not tailor your resume. Try again.",
        );
        return;
      }

      setWasTailored(true);
      setSuccessMessage("Tailored resume is ready.");
      router.refresh();
    } catch (tailorError) {
      console.error("[TailorAndApply]", tailorError);
      setError("Could not tailor your resume. Try again.");
    } finally {
      setIsTailoring(false);
    }
  }

  async function applyManually(): Promise<void> {
    try {
      setIsApplying(true);
      const response = await fetch(`/api/jobs/${jobId}/apply`, {
        method: "POST",
      });
      const result: unknown = await response.json();

      if (!isManualApplyResult(result) || !result.success) {
        setError(
          isManualApplyResult(result) && result.error
            ? result.error
            : "Could not apply to this job. Try again.",
        );
        return;
      }

      setSuccessMessage("Apply attempt finished.");
      router.refresh();
    } catch (applyError) {
      console.error("[TailorAndApply/apply]", applyError);
      setError("Could not apply to this job. Try again.");
    } finally {
      setIsApplying(false);
    }
  }

  return (
    <section className="rounded-xl border border-default bg-surface p-4">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm font-medium text-text-primary">
          Browserbase review
        </p>
        <Badge
          variant="outline"
          className="rounded-full border-state-warning/20 bg-state-warning-dim px-2.5 py-1 text-xs font-medium text-state-warning">
          Experimental
        </Badge>
      </div>
      <p className="mt-2 text-xs leading-5 text-text-muted">{helperText}</p>

      <p className="mt-4 flex items-start gap-2 text-xs leading-5 text-state-warning">
        <FlaskConical className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span>
          Runs the current Browserbase path as-is and may stop or misfill
          fields.
        </span>
      </p>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row lg:flex-col">
        {!isEasyApply ? (
          <button
            type="button"
            disabled={!canTailor}
            onClick={handleTailor}
            className="inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-xl bg-accent-primary px-4 py-2 text-sm font-medium text-bg-base transition-colors hover:bg-accent-hover hover:shadow-accent disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:bg-accent-primary disabled:hover:shadow-none">
            {wasTailored ? (
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            ) : hasBaseResume ? (
              <FilePenLine className="h-4 w-4" aria-hidden="true" />
            ) : (
              <LockKeyhole className="h-4 w-4" aria-hidden="true" />
            )}
            {isTailoring
              ? "Tailoring..."
              : wasTailored
                ? "Regenerate tailored resume"
                : "Tailor resume"}
          </button>
        ) : null}
        <button
          type="button"
          disabled={!canApply}
          onClick={handleApply}
          className="inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-xl border border-default bg-elevated px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:border-subtle hover:bg-subtle hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:border-default disabled:hover:bg-elevated disabled:hover:text-text-secondary">
          {isEasyApply ? (
            !linkedinConnected ? (
              <LockKeyhole className="h-4 w-4" aria-hidden="true" />
            ) : (
              <SendHorizontal className="h-4 w-4" aria-hidden="true" />
            )
          ) : wasTailored ? (
            <SendHorizontal className="h-4 w-4" aria-hidden="true" />
          ) : (
            <LockKeyhole className="h-4 w-4" aria-hidden="true" />
          )}
          {isApplying
            ? "Attempting..."
            : isEasyApply
              ? !linkedinConnected
                ? "Connect LinkedIn first"
                : "Run Easy Apply attempt"
              : "Run apply attempt"}
        </button>
      </div>

      {successMessage ? (
        <div className="mt-4 rounded-xl border border-state-success/20 bg-state-success-dim p-3">
          <p className="text-sm font-medium text-state-success">
            {successMessage}
          </p>
        </div>
      ) : null}

      {error ? (
        <div className="mt-4 rounded-xl border border-state-error/20 bg-state-error-dim p-3">
          <p className="text-sm font-medium text-state-error">{error}</p>
        </div>
      ) : null}
    </section>
  );
}

function isResumeTailorResult(value: unknown): value is ResumeTailorResult {
  if (value === null || typeof value !== "object") {
    return false;
  }

  return "success" in value && typeof value.success === "boolean";
}

function isManualApplyResult(value: unknown): value is ManualApplyResult {
  if (value === null || typeof value !== "object") {
    return false;
  }

  return "success" in value && typeof value.success === "boolean";
}
