"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CheckCircle2, FilePenLine, LockKeyhole } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { ResumeTailorResult } from "@/types";

type TailorAndApplyProps = {
  jobId: string;
  hasBaseResume: boolean;
  isTailored: boolean;
};

export function TailorAndApply({
  jobId,
  hasBaseResume,
  isTailored,
}: TailorAndApplyProps) {
  const router = useRouter();
  const [isTailoring, setIsTailoring] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [wasTailored, setWasTailored] = useState(isTailored);
  const helperText = hasBaseResume
    ? wasTailored
      ? "Regenerate a tailored resume when the job description or profile evidence changes."
      : "Tailor your saved resume to this role before applying outside JobPilot."
    : "Generate your base resume on the profile page before tailoring it for this job.";
  const canTailor = hasBaseResume && !isTailoring;

  function handleTailor(): void {
    if (!canTailor) {
      return;
    }

    setError("");
    setSuccessMessage("");
    void tailorResume();
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

  return (
    <section className="rounded-xl border border-default bg-surface p-4">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm font-medium text-text-primary">
          Resume tailoring
        </p>
        <Badge
          variant="outline"
          className="rounded-full border-accent-border bg-accent-dim px-2.5 py-1 text-xs font-medium text-accent-text">
          GPT-4o
        </Badge>
      </div>
      <p className="mt-2 text-xs leading-5 text-text-muted">{helperText}</p>

      <div className="mt-4">
        <button
          type="button"
          disabled={!canTailor}
          onClick={handleTailor}
          className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-xl bg-accent-primary px-4 py-2 text-sm font-medium text-bg-base transition-colors hover:bg-accent-hover hover:shadow-accent disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:bg-accent-primary disabled:hover:shadow-none">
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
