import "server-only";

import { Stagehand } from "@browserbasehq/stagehand";
import { z } from "zod";

import {
  type BrowserbaseSession,
  createBrowserbaseSession,
  releaseBrowserbaseSession,
} from "@/lib/browserbase";

const DEFAULT_STAGEHAND_MODEL = "openai/gpt-4o";

type StagehandSessionOptions = {
  timeout?: number;
  metadata?: Record<string, string>;
  contextId?: string;
  persistContext?: boolean;
  experimental?: boolean;
  modelName?: string;
  viewport?: {
    width: number;
    height: number;
  };
};

export type StagehandSession = {
  stagehand: Stagehand;
  browserbaseSession: BrowserbaseSession;
};

export type StagehandVerificationResult = {
  sessionId: string;
  recordingUrl: string;
  pageTitle: string;
  closed: boolean;
};

const verificationSchema = z.object({
  title: z.string().describe("The main title or heading of the current page."),
});

function getRequiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required to initialize Stagehand.`);
  }

  return value;
}

export function normalizeStagehandModelName(modelName: string): string {
  const trimmed = modelName.trim();
  const normalized = trimmed.toLowerCase();

  // Add anthropic/ prefix for bare Claude model names
  if (
    normalized === "claude-sonnet-4-6" ||
    normalized === "claude-4.6-sonnet"
  ) {
    return "anthropic/claude-sonnet-4-6";
  }

  if (
    normalized === "claude-3-7-sonnet-latest" ||
    normalized === "claude-3-7-sonnet-20250219"
  ) {
    return "anthropic/claude-3-7-sonnet-20250219";
  }

  return trimmed;
}

function resolveStagehandModel(modelName?: string): string {
  const explicitModel = modelName?.trim();

  if (explicitModel) {
    return normalizeStagehandModelName(explicitModel);
  }

  const envModel = process.env.STAGEHAND_MODEL?.trim();

  if (envModel) {
    return normalizeStagehandModelName(envModel);
  }

  return DEFAULT_STAGEHAND_MODEL;
}

function resolveStagehandApiKey(modelName: string): string {
  const normalizedModel = modelName.toLowerCase();

  if (
    normalizedModel.startsWith("anthropic/") ||
    normalizedModel.includes("claude")
  ) {
    return getRequiredEnv("CLAUDE_API_KEY");
  }

  return getRequiredEnv("OPENAI_API_KEY");
}

export async function createStagehandSession(
  options: StagehandSessionOptions = {},
): Promise<StagehandSession> {
  const modelName = resolveStagehandModel(options.modelName);
  const modelApiKey = resolveStagehandApiKey(modelName);

  const browserbaseSession = await createBrowserbaseSession({
    timeout: options.timeout,
    contextId: options.contextId,
    persistContext: options.persistContext,
    viewport: options.viewport,
    metadata: {
      feature: "stagehand-setup",
      ...options.metadata,
    },
  });

  let stagehand: Stagehand | undefined;

  try {
    stagehand = new Stagehand({
      env: "BROWSERBASE",
      apiKey: getRequiredEnv("BROWSERBASE_API_KEY"),
      projectId: getRequiredEnv("BROWSERBASE_PROJECT_ID"),
      browserbaseSessionID: browserbaseSession.id,
      model: {
        modelName,
        apiKey: modelApiKey,
      },
      disablePino: true,
      disableAPI: true,
      experimental: options.experimental ?? false,
      waitForCaptchaSolves: true,
    });

    await stagehand.init();

    return {
      stagehand,
      browserbaseSession,
    };
  } catch (error) {
    console.error("[stagehand/create]", error);

    if (stagehand) {
      await stagehand.close({ force: true });
    } else {
      await releaseBrowserbaseSession(browserbaseSession.id);
    }

    throw error;
  }
}

export async function connectStagehandToBrowserbaseSession(input: {
  sessionId: string;
}): Promise<StagehandSession> {
  const modelName = resolveStagehandModel();
  const modelApiKey = resolveStagehandApiKey(modelName);

  const browserbaseSession: BrowserbaseSession = {
    id: input.sessionId,
    connectUrl: "",
    recordingUrl: `https://browserbase.com/sessions/${input.sessionId}`,
  };
  let stagehand: Stagehand | undefined;

  try {
    stagehand = new Stagehand({
      env: "BROWSERBASE",
      apiKey: getRequiredEnv("BROWSERBASE_API_KEY"),
      projectId: getRequiredEnv("BROWSERBASE_PROJECT_ID"),
      browserbaseSessionID: input.sessionId,
      model: {
        modelName,
        apiKey: modelApiKey,
      },
      disablePino: true,
      disableAPI: true,
      waitForCaptchaSolves: true,
    });

    await stagehand.init();

    return {
      stagehand,
      browserbaseSession,
    };
  } catch (error) {
    console.error("[stagehand/connect]", error);

    if (stagehand) {
      await stagehand.close({ force: true });
    }

    throw error;
  }
}

export async function navigateBrowserbaseSession(input: {
  sessionId: string;
  url: string;
}): Promise<void> {
  const session = await connectStagehandToBrowserbaseSession({
    sessionId: input.sessionId,
  });
  const page = session.stagehand.context.pages()[0];

  if (!page) {
    await session.stagehand.close({ force: true });
    throw new Error("Stagehand did not initialize an active page.");
  }

  await page.goto(input.url, {
    waitUntil: "domcontentloaded",
    timeoutMs: 45_000,
  });
}

export async function closeStagehandSession(
  session: StagehandSession,
): Promise<void> {
  await session.stagehand.close();
}

export async function verifyStagehandConnection(): Promise<StagehandVerificationResult> {
  const session = await createStagehandSession({
    metadata: {
      purpose: "connection-verification",
    },
  });

  try {
    const page = session.stagehand.context.pages()[0];

    if (!page) {
      throw new Error("Stagehand did not initialize an active page.");
    }

    await page.goto("https://example.com", {
      waitUntil: "domcontentloaded",
      timeoutMs: 30_000,
    });

    const result = await session.stagehand.extract(
      "Extract the visible page title.",
      verificationSchema,
    );

    await closeStagehandSession(session);

    return {
      sessionId: session.browserbaseSession.id,
      recordingUrl: session.browserbaseSession.recordingUrl,
      pageTitle: result.title,
      closed: true,
    };
  } catch (error) {
    console.error("[stagehand/verify]", error);
    await session.stagehand.close({ force: true });

    throw error;
  }
}
