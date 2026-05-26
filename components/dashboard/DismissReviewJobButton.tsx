"use client";

import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { dismissReviewJob } from "@/actions/jobs";

type DismissReviewJobButtonProps = {
  jobId: string;
};

export function DismissReviewJobButton({
  jobId,
}: DismissReviewJobButtonProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function handleDismiss(): void {
    startTransition(async () => {
      setError("");
      const result = await dismissReviewJob(jobId);

      if (result.success) {
        router.refresh();
        return;
      }

      setError(result.error ?? "Could not dismiss this job. Try again.");
    });
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        onClick={handleDismiss}
        disabled={pending}
        className="inline-flex h-8 items-center gap-1.5 rounded-xl px-3 text-xs font-medium text-text-muted transition-colors hover:bg-subtle hover:text-text-secondary disabled:cursor-not-allowed disabled:opacity-70"
      >
        <X className="h-4 w-4" aria-hidden="true" />
        {pending ? "Dismissing" : "Dismiss"}
      </button>
      {error ? (
        <p className="max-w-40 text-xs leading-5 text-state-error">{error}</p>
      ) : null}
    </div>
  );
}
