"use client";

import { LoaderCircle, MapPin, Search, Square } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import type {
  AgentFindResult,
  AgentStopResult,
  DashboardActiveRun,
} from "@/types";

type AgentControlsProps = {
  activeRun: DashboardActiveRun | null;
  defaultJobTitle: string;
  defaultLocation: string;
};

function isAgentFindResult(value: unknown): value is AgentFindResult {
  if (value === null || typeof value !== "object") {
    return false;
  }

  return "success" in value && typeof value.success === "boolean";
}

function isAgentStopResult(value: unknown): value is AgentStopResult {
  if (value === null || typeof value !== "object") {
    return false;
  }

  return "success" in value && typeof value.success === "boolean";
}

function getRunStatusLabel(status: string): string {
  if (status === "finding") {
    return "Finding jobs";
  }

  if (status === "applying") {
    return "Running apply attempt";
  }

  return "Running";
}

export function AgentControls({
  activeRun,
  defaultJobTitle,
  defaultLocation,
}: AgentControlsProps) {
  const router = useRouter();
  const [jobTitle, setJobTitle] = useState(defaultJobTitle);
  const [location, setLocation] = useState(defaultLocation);
  const [isFinding, setIsFinding] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const hasActiveRun = activeRun !== null;
  const controlsDisabled = isFinding || isStopping || hasActiveRun;
  const canFind =
    jobTitle.trim().length > 0 && location.trim().length > 0 && !controlsDisabled;
  const canStop = hasActiveRun && !isStopping && !isFinding;

  function handleFind(): void {
    if (!jobTitle.trim() || !location.trim()) {
      setError("Enter a job title and location before starting the agent.");
      setSuccessMessage("");
      return;
    }

    if (!canFind) {
      return;
    }

    setError("");
    setSuccessMessage("");
    void findJobs();
  }

  function handleStop(): void {
    if (!canStop) {
      return;
    }

    setError("");
    setSuccessMessage("");
    void stopAgent();
  }

  async function findJobs(): Promise<void> {
    try {
      setIsFinding(true);
      const response = await fetch("/api/agent/find", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jobTitle: jobTitle.trim(),
          location: location.trim(),
        }),
      });
      const result: unknown = await response.json();

      if (!isAgentFindResult(result) || !result.success || !result.data) {
        setError(
          isAgentFindResult(result) && result.error
            ? result.error
            : "Could not start the agent. Try again.",
        );
        return;
      }

      setSuccessMessage(
        `Found ${result.data.savedJobs} jobs and saved ${result.data.matchedJobs} strong matches.`,
      );
      router.refresh();
    } catch (findError) {
      console.error("[AgentControls/find]", findError);
      setError("Could not start the agent. Try again.");
    } finally {
      setIsFinding(false);
    }
  }

  async function stopAgent(): Promise<void> {
    try {
      setIsStopping(true);
      const response = await fetch("/api/agent/stop", {
        method: "POST",
      });
      const result: unknown = await response.json();

      if (!isAgentStopResult(result) || !result.success || !result.data) {
        setError(
          isAgentStopResult(result) && result.error
            ? result.error
            : "Could not stop the agent. Try again.",
        );
        return;
      }

      setSuccessMessage(
        result.data.stopped
          ? "Agent run stopped."
          : "No active agent run was found.",
      );
      router.refresh();
    } catch (stopError) {
      console.error("[AgentControls/stop]", stopError);
      setError("Could not stop the agent. Try again.");
    } finally {
      setIsStopping(false);
    }
  }

  return (
    <section className="rounded-2xl border border-default bg-surface">
      <div className="border-b border-default px-5 py-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm text-accent-text">Agent controls</p>
            <h1 className="mt-1 text-3xl font-semibold text-text-primary">
              Start a job search
            </h1>
          </div>
          {activeRun ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-state-warning/20 bg-state-warning-dim px-2.5 py-1 text-xs font-medium text-state-warning">
              <LoaderCircle
                className="h-4 w-4 animate-spin"
                aria-hidden="true"
              />
              {getRunStatusLabel(activeRun.status)}
            </span>
          ) : null}
        </div>
      </div>
      <div className="p-5">
        <div className="rounded-2xl border border-default bg-elevated p-5">
          <div className="grid gap-4 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-text-secondary">
                Job title
              </span>
              <span className="relative">
                <Search
                  className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-text-muted"
                  aria-hidden="true"
                />
                <input
                  type="text"
                  value={jobTitle}
                  disabled={controlsDisabled}
                  onChange={(event) => setJobTitle(event.target.value)}
                  placeholder="Frontend Engineer"
                  className="h-10 w-full rounded-xl border border-default bg-subtle px-9 text-sm text-text-primary outline-none transition-colors placeholder:text-text-muted focus:border-accent-border focus:ring-1 focus:ring-accent-border disabled:cursor-not-allowed disabled:opacity-70"
                />
              </span>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-text-secondary">
                Location
              </span>
              <span className="relative">
                <MapPin
                  className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-text-muted"
                  aria-hidden="true"
                />
                <input
                  type="text"
                  value={location}
                  disabled={controlsDisabled}
                  onChange={(event) => setLocation(event.target.value)}
                  placeholder="Remote"
                  className="h-10 w-full rounded-xl border border-default bg-subtle px-9 text-sm text-text-primary outline-none transition-colors placeholder:text-text-muted focus:border-accent-border focus:ring-1 focus:ring-accent-border disabled:cursor-not-allowed disabled:opacity-70"
                />
              </span>
            </label>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={!canFind}
                onClick={handleFind}
                className="inline-flex h-9 items-center gap-2 rounded-xl bg-accent-primary px-4 text-sm font-medium text-bg-base transition-colors hover:bg-accent-hover hover:shadow-accent disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:bg-accent-primary disabled:hover:shadow-none"
              >
                {isFinding ? (
                  <LoaderCircle
                    className="h-4 w-4 animate-spin"
                    aria-hidden="true"
                  />
                ) : (
                  <Search className="h-4 w-4" aria-hidden="true" />
                )}
                {isFinding ? "Finding..." : "Find jobs"}
              </button>

              {hasActiveRun ? (
                <button
                  type="button"
                  disabled={!canStop}
                  onClick={handleStop}
                  className="inline-flex h-9 items-center gap-2 rounded-xl border border-state-error/25 bg-state-error-dim px-4 text-sm font-medium text-state-error transition-colors hover:bg-state-error/20 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:bg-state-error-dim"
                >
                  {isStopping ? (
                    <LoaderCircle
                      className="h-4 w-4 animate-spin"
                      aria-hidden="true"
                    />
                  ) : (
                    <Square className="h-4 w-4" aria-hidden="true" />
                  )}
                  {isStopping ? "Stopping..." : "Stop"}
                </button>
              ) : null}
            </div>
          </div>

          {activeRun ? (
            <div className="mt-4 rounded-xl border border-state-warning/20 bg-state-warning-dim p-3">
              <p className="text-sm font-medium text-state-warning">
                A search for {activeRun.jobTitle || "jobs"} in{" "}
                {activeRun.location || "your selected location"} is active.
              </p>
            </div>
          ) : null}

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
        </div>
      </div>
    </section>
  );
}
