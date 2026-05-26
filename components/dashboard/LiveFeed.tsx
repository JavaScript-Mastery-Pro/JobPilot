"use client";

import { Activity, CircleAlert, LoaderCircle } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { createInsforgeClient } from "@/lib/insforge-client";
import { cn } from "@/lib/utils";
import type { AgentLogLevel, DashboardAgentLog } from "@/types";

const MAX_LOGS = 30;

type LiveFeedProps = {
  userId: string;
  initialLogs: DashboardAgentLog[];
  initialRunId: string;
};

type RealtimeTokenResult = {
  success: boolean;
  data?: {
    accessToken: string;
  };
  error?: string;
};

type AgentLogPayload = {
  id?: unknown;
  run_id?: unknown;
  level?: unknown;
  message?: unknown;
  job_id?: unknown;
  created_at?: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object";
}

function isRealtimeTokenResult(value: unknown): value is RealtimeTokenResult {
  return isRecord(value) && typeof value.success === "boolean";
}

function getStringValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function getLogLevel(value: unknown): AgentLogLevel {
  if (
    value === "info" ||
    value === "success" ||
    value === "warning" ||
    value === "error"
  ) {
    return value;
  }

  return "info";
}

function normalizeIncomingLog(payload: unknown): DashboardAgentLog | null {
  if (!isRecord(payload)) {
    return null;
  }

  const logPayload: AgentLogPayload = payload;
  const id = getStringValue(logPayload.id);
  const runId = getStringValue(logPayload.run_id);
  const message = getStringValue(logPayload.message);

  if (!id || !runId || !message) {
    return null;
  }

  return {
    id,
    runId,
    level: getLogLevel(logPayload.level),
    message,
    jobId: getStringValue(logPayload.job_id),
    createdAt: getStringValue(logPayload.created_at),
  };
}

function sortNewestFirst(logs: DashboardAgentLog[]): DashboardAgentLog[] {
  return [...logs].sort((firstLog, secondLog) => {
    return secondLog.createdAt.localeCompare(firstLog.createdAt);
  });
}

function prependLog(
  currentLogs: DashboardAgentLog[],
  incomingLog: DashboardAgentLog,
  selectedRunId: string,
): DashboardAgentLog[] {
  if (incomingLog.runId !== selectedRunId) {
    return [incomingLog];
  }

  const withoutDuplicate = currentLogs.filter((log: DashboardAgentLog) => {
    return log.id !== incomingLog.id;
  });

  return sortNewestFirst([incomingLog, ...withoutDuplicate]).slice(0, MAX_LOGS);
}

function getLevelDotClass(level: AgentLogLevel): string {
  if (level === "success") {
    return "bg-state-success";
  }

  if (level === "warning") {
    return "bg-state-warning";
  }

  if (level === "error") {
    return "bg-state-error";
  }

  return "bg-state-neutral";
}

function getLevelTextClass(level: AgentLogLevel): string {
  if (level === "success") {
    return "text-state-success";
  }

  if (level === "warning") {
    return "text-state-warning";
  }

  if (level === "error") {
    return "text-state-error";
  }

  return "text-text-muted";
}

function formatTimestamp(value: string): string {
  if (!value) {
    return "--:--";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "--:--";
  }

  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

async function loadRealtimeToken(): Promise<string> {
  const response = await fetch("/api/auth/realtime-token", {
    method: "GET",
  });
  const result: unknown = await response.json();

  if (!isRealtimeTokenResult(result) || !result.success || !result.data) {
    throw new Error(
      isRealtimeTokenResult(result) && result.error
        ? result.error
        : "Could not connect to live agent logs.",
    );
  }

  return result.data.accessToken;
}

function LiveFeedEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16">
      <Activity className="h-10 w-10 text-text-faint" aria-hidden="true" />
      <h2 className="text-base font-medium text-text-muted">
        No agent activity yet
      </h2>
      <p className="max-w-xs text-center text-sm leading-6 text-text-faint">
        Start a job search and the agent&apos;s progress will appear here as it
        works.
      </p>
    </div>
  );
}

function LiveFeedEntry({ log }: { log: DashboardAgentLog }) {
  return (
    <article className="flex items-start gap-3 border-b border-default py-2.5 last:border-0">
      <time className="w-16 shrink-0 pt-0.5 font-mono text-xs text-text-faint">
        {formatTimestamp(log.createdAt)}
      </time>
      <span
        className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", getLevelDotClass(log.level))}
        aria-hidden="true"
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm leading-6 text-text-secondary">{log.message}</p>
        <p
          className={cn(
            "mt-1 text-xs font-medium uppercase tracking-wide",
            getLevelTextClass(log.level),
          )}
        >
          {log.level}
        </p>
      </div>
    </article>
  );
}

export function LiveFeed({
  userId,
  initialLogs,
  initialRunId,
}: LiveFeedProps) {
  const [logs, setLogs] = useState<DashboardAgentLog[]>(
    sortNewestFirst(initialLogs).slice(0, MAX_LOGS),
  );
  const selectedRunIdRef = useRef(initialRunId);
  const [connectionStatus, setConnectionStatus] = useState("Connecting");
  const [error, setError] = useState("");
  const channelName = useMemo(() => `agent-logs:${userId}`, [userId]);

  useEffect(() => {
    let isMounted = true;
    const insforge = createInsforgeClient();

    function handleIncomingLog(payload: unknown): void {
      const incomingLog = normalizeIncomingLog(payload);

      if (!incomingLog || !isMounted) {
        return;
      }

      const currentSelectedRunId = selectedRunIdRef.current;
      selectedRunIdRef.current = incomingLog.runId;
      setLogs((currentLogs: DashboardAgentLog[]) => {
        return prependLog(currentLogs, incomingLog, currentSelectedRunId);
      });
    }

    async function connectToFeed(): Promise<void> {
      try {
        setConnectionStatus("Connecting");
        const accessToken = await loadRealtimeToken();
        insforge.setAccessToken(accessToken);
        await insforge.realtime.connect();
        const subscription = await insforge.realtime.subscribe(channelName);

        if (!subscription.ok) {
          throw new Error(
            subscription.error?.message ?? "Could not subscribe to live logs.",
          );
        }

        insforge.realtime.on<unknown>("agent_log_inserted", handleIncomingLog);

        if (isMounted) {
          setConnectionStatus("Live");
          setError("");
        }
      } catch (connectError) {
        console.error("[LiveFeed/connect]", connectError);

        if (isMounted) {
          setConnectionStatus("Offline");
          setError("Live updates are unavailable. Refresh to load recent logs.");
        }
      }
    }

    void connectToFeed();

    return () => {
      isMounted = false;
      insforge.realtime.off<unknown>("agent_log_inserted", handleIncomingLog);
      insforge.realtime.unsubscribe(channelName);
      insforge.realtime.disconnect();
    };
  }, [channelName]);

  return (
    <section className="rounded-2xl border border-default bg-surface">
      <div className="border-b border-default px-5 py-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm text-accent-text">Live agent feed</p>
            <h1 className="mt-1 text-3xl font-semibold text-text-primary">
              Agent activity
            </h1>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-state-neutral/20 bg-state-neutral-dim px-2.5 py-1 text-xs font-medium text-state-neutral">
            {connectionStatus === "Connecting" ? (
              <LoaderCircle
                className="h-4 w-4 animate-spin"
                aria-hidden="true"
              />
            ) : (
              <Activity className="h-4 w-4" aria-hidden="true" />
            )}
            {connectionStatus}
          </span>
        </div>
      </div>
      <div className="p-5">
        {error ? (
          <div className="mb-4 rounded-xl border border-state-error/20 bg-state-error-dim p-3">
            <p className="flex items-start gap-2 text-sm font-medium text-state-error">
              <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              {error}
            </p>
          </div>
        ) : null}

        {logs.length > 0 ? (
          <div className="rounded-2xl border border-default bg-elevated px-5 py-2">
            {logs.map((log: DashboardAgentLog) => (
              <LiveFeedEntry key={log.id} log={log} />
            ))}
          </div>
        ) : (
          <LiveFeedEmptyState />
        )}
      </div>
    </section>
  );
}
