"use client";

import { CheckCircle, Link, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type ImportJobSuccessData = {
  jobId: string;
  title: string;
  company: string;
  matchScore: number;
  matchReason: string;
};

type ImportJobResult =
  | {
      success: true;
      data: ImportJobSuccessData;
    }
  | {
      success: false;
      error: string;
    };

function isImportJobResult(value: unknown): value is ImportJobResult {
  if (value === null || typeof value !== "object") {
    return false;
  }

  return (
    "success" in value &&
    typeof (value as Record<string, unknown>).success === "boolean"
  );
}

export function ImportJobUrl() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ImportJobSuccessData | null>(null);

  const canImport = url.trim().length > 0 && !isImporting;

  function handleImport(): void {
    if (!canImport) {
      return;
    }

    setError("");
    setResult(null);
    void importJob();
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>): void {
    if (event.key === "Enter") {
      handleImport();
    }
  }

  async function importJob(): Promise<void> {
    try {
      setIsImporting(true);

      const response = await fetch("/api/jobs/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data: unknown = await response.json();

      if (!isImportJobResult(data)) {
        setError("Unexpected response from server. Try again.");
        return;
      }

      if (!data.success) {
        setError(data.error);
        return;
      }

      setResult(data.data);
      setUrl("");
      router.refresh();
    } catch (importError) {
      console.error("[ImportJobUrl/importJob]", importError);
      setError(
        "Could not import the job. Check your connection and try again.",
      );
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <section className="rounded-2xl border border-default bg-surface">
      <div className="border-b border-default px-5 py-4">
        <p className="text-sm text-accent-text">Manual import</p>
        <h2 className="mt-1 text-xl font-semibold text-text-primary">
          Import a job by URL
        </h2>
        <p className="mt-1 text-sm text-text-muted">
          Paste any job listing link and the agent will fetch the details and
          score it against your profile.
        </p>
      </div>
      <div className="p-5">
        <div className="rounded-2xl border border-default bg-elevated p-5">
          <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-text-secondary">
                Job URL
              </span>
              <span className="relative">
                <Link
                  className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-text-muted"
                  aria-hidden="true"
                />
                <input
                  type="url"
                  value={url}
                  disabled={isImporting}
                  onChange={(event) => setUrl(event.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="https://jobs.company.com/posting/12345"
                  className="h-10 w-full rounded-xl border border-default bg-subtle px-9 text-sm text-text-primary outline-none transition-colors placeholder:text-text-muted focus:border-accent-border focus:ring-1 focus:ring-accent-border disabled:cursor-not-allowed disabled:opacity-70"
                />
              </span>
            </label>
            <button
              type="button"
              disabled={!canImport}
              onClick={handleImport}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-accent-primary px-5 text-sm font-medium text-bg-base transition-colors hover:bg-accent-hover hover:shadow-accent disabled:cursor-not-allowed disabled:opacity-50">
              {isImporting ? (
                <>
                  <LoaderCircle
                    className="h-4 w-4 animate-spin"
                    aria-hidden="true"
                  />
                  Importing...
                </>
              ) : (
                "Import & Match"
              )}
            </button>
          </div>

          {error ? (
            <div className="mt-4 rounded-xl border border-state-error/20 bg-state-error-dim px-4 py-3">
              <p className="text-sm text-state-error">{error}</p>
            </div>
          ) : null}

          {result ? (
            <div className="mt-4 rounded-xl border border-state-success/20 bg-state-success-dim px-4 py-3">
              <div className="flex items-start gap-3">
                <CheckCircle
                  className="mt-0.5 h-4 w-4 shrink-0 text-state-success"
                  aria-hidden="true"
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-state-success">
                    Job imported — {result.matchScore}% match
                  </p>
                  <p className="mt-0.5 text-sm text-text-secondary">
                    {result.title} at {result.company}
                  </p>
                  <p className="mt-1 text-xs text-text-muted">
                    {result.matchReason}
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
