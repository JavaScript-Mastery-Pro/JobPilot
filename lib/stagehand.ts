import "server-only";

import { Stagehand } from "@browserbasehq/stagehand";
import { z } from "zod";

import {
  type BrowserbaseSession,
  createBrowserbaseSession,
  releaseBrowserbaseSession,
} from "@/lib/browserbase";

const STAGEHAND_MODEL = "openai/gpt-4o";

type StagehandSessionOptions = {
  timeout?: number;
  metadata?: Record<string, string>;
  contextId?: string;
  persistContext?: boolean;
  experimental?: boolean;
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

export async function createStagehandSession(
  options: StagehandSessionOptions = {},
): Promise<StagehandSession> {
  const browserbaseSession = await createBrowserbaseSession({
    timeout: options.timeout,
    contextId: options.contextId,
    persistContext: options.persistContext,
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
        modelName: STAGEHAND_MODEL,
        apiKey: getRequiredEnv("OPENAI_API_KEY"),
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
        modelName: STAGEHAND_MODEL,
        apiKey: getRequiredEnv("OPENAI_API_KEY"),
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
