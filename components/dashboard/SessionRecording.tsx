import { ExternalLink, MonitorPlay, VideoOff } from "lucide-react";

import type { DashboardSessionRecording } from "@/types";

type SessionRecordingProps = {
  recording: DashboardSessionRecording | null;
};

function getStatusLabel(recording: DashboardSessionRecording): string {
  if (recording.isActive) {
    return "Active";
  }

  if (recording.status === "completed") {
    return "Latest run";
  }

  return "Recent run";
}

function SessionRecordingEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16">
      <VideoOff
        className="h-10 w-10 text-text-faint"
        strokeWidth={1.5}
        aria-hidden="true"
      />
      <h2 className="text-base font-medium text-text-muted">
        No recording yet
      </h2>
      <p className="max-w-xs text-center text-sm leading-6 text-text-faint">
        Start a job search and the Browserbase session recording will appear
        here.
      </p>
    </div>
  );
}

export function SessionRecording({ recording }: SessionRecordingProps) {
  const recordingUrl = recording?.browserbaseRecordingUrl ?? "";
  const hasRecording = recordingUrl.length > 0;

  return (
    <section className="rounded-2xl border border-default bg-surface">
      <div className="border-b border-default px-5 py-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm text-accent-text">Session recording</p>
            <h1 className="mt-1 text-3xl font-semibold text-text-primary">
              Browser session
            </h1>
          </div>
          {recording ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-state-info/20 bg-state-info-dim px-2.5 py-1 text-xs font-medium text-state-info">
              <MonitorPlay className="h-4 w-4" aria-hidden="true" />
              {getStatusLabel(recording)}
            </span>
          ) : null}
        </div>
      </div>
      <div className="p-5">
        {hasRecording ? (
          <div className="rounded-2xl border border-default bg-elevated p-5">
            <div className="overflow-hidden rounded-xl border border-default bg-subtle">
              <iframe
                src={recordingUrl}
                title="Browserbase session recording"
                className="h-[28rem] w-full"
                allow="fullscreen"
              />
            </div>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-text-primary">
                  {recording?.jobTitle || "Job search"}
                </p>
                <p className="mt-1 text-sm text-text-secondary">
                  {recording?.location || "Selected location"}
                </p>
              </div>
              <a
                href={recordingUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-default bg-elevated px-4 text-sm font-medium text-text-secondary transition-colors hover:border-subtle hover:bg-subtle hover:text-text-primary"
              >
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
                Open recording
              </a>
            </div>
          </div>
        ) : (
          <SessionRecordingEmptyState />
        )}
      </div>
    </section>
  );
}
