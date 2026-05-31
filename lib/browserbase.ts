import "server-only";

import Browserbase from "@browserbasehq/sdk";

type BrowserbaseSessionOptions = {
  timeout?: number;
  metadata?: Record<string, string>;
  contextId?: string;
  persistContext?: boolean;
  viewport?: {
    width: number;
    height: number;
  };
};

export type BrowserbaseSession = {
  id: string;
  connectUrl: string;
  recordingUrl: string;
  contextId?: string;
  debuggerUrl?: string;
  debuggerFullscreenUrl?: string;
};

export type BrowserbaseVerificationResult = {
  sessionId: string;
  recordingUrl: string;
  released: boolean;
};

function getRequiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required to create Browserbase sessions.`);
  }

  return value;
}

function createBrowserbaseClient(): Browserbase {
  return new Browserbase({
    apiKey: getRequiredEnv("BROWSERBASE_API_KEY"),
  });
}

function shouldUseAdvancedStealth(): boolean {
  return process.env.BROWSERBASE_ADVANCED_STEALTH === "true";
}

function sanitizeMetadataValue(value: string): string {
  const sanitizedValue = value
    .trim()
    .replace(/[^a-zA-Z0-9_.:-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96);

  return sanitizedValue || "unknown";
}

function sanitizeMetadata(
  metadata: Record<string, string> | undefined,
): Record<string, string> | undefined {
  if (!metadata) {
    return undefined;
  }

  return Object.fromEntries(
    Object.entries(metadata).map(([key, value]) => {
      return [key, sanitizeMetadataValue(value)];
    }),
  );
}

export function getBrowserbaseRecordingUrl(sessionId: string): string {
  return `https://browserbase.com/sessions/${sessionId}`;
}

export async function createBrowserbaseSession(
  options: BrowserbaseSessionOptions = {},
): Promise<BrowserbaseSession> {
  const client = createBrowserbaseClient();
  const session = await client.sessions.create({
    projectId: getRequiredEnv("BROWSERBASE_PROJECT_ID"),
    browserSettings: {
      advancedStealth: shouldUseAdvancedStealth(),
      recordSession: true,
      solveCaptchas: true,
      viewport: options.viewport,
      context: options.contextId
        ? {
            id: options.contextId,
            persist: options.persistContext ?? false,
          }
        : undefined,
    },
    timeout: options.timeout,
    userMetadata: sanitizeMetadata(options.metadata),
  });

  return {
    id: session.id,
    connectUrl: session.connectUrl,
    recordingUrl: getBrowserbaseRecordingUrl(session.id),
    contextId: session.contextId,
  };
}

export async function createBrowserbaseContext(): Promise<string> {
  const client = createBrowserbaseClient();
  const context = await client.contexts.create({
    projectId: getRequiredEnv("BROWSERBASE_PROJECT_ID"),
  });

  return context.id;
}

export async function createBrowserbaseSessionWithDebugUrl(
  options: BrowserbaseSessionOptions = {},
): Promise<BrowserbaseSession> {
  const client = createBrowserbaseClient();
  const session = await createBrowserbaseSession(options);
  const debugUrls = await client.sessions.debug(session.id);

  return {
    ...session,
    debuggerUrl: debugUrls.debuggerUrl,
    debuggerFullscreenUrl: debugUrls.debuggerFullscreenUrl,
  };
}

export async function releaseBrowserbaseSession(
  sessionId: string,
): Promise<void> {
  const client = createBrowserbaseClient();

  await client.sessions.update(sessionId, {
    projectId: getRequiredEnv("BROWSERBASE_PROJECT_ID"),
    status: "REQUEST_RELEASE",
  });
}

export async function verifyBrowserbaseConnection(): Promise<BrowserbaseVerificationResult> {
  const session = await createBrowserbaseSession({
    metadata: {
      feature: "browserbase-setup",
      purpose: "connection-verification",
    },
  });

  try {
    await releaseBrowserbaseSession(session.id);

    return {
      sessionId: session.id,
      recordingUrl: session.recordingUrl,
      released: true,
    };
  } catch (error) {
    console.error("[browserbase/verify]", error);

    return {
      sessionId: session.id,
      recordingUrl: session.recordingUrl,
      released: false,
    };
  }
}
