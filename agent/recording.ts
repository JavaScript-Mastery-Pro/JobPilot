import "server-only";

import { createInsforgeServer } from "@/lib/insforge-server";

type SaveBrowserbaseRecordingInput = {
  accessToken: string;
  runId: string;
  userId: string;
  sessionId: string;
  recordingUrl: string;
};

export async function saveBrowserbaseRecording(
  input: SaveBrowserbaseRecordingInput,
): Promise<void> {
  const insforge = createInsforgeServer(input.accessToken);
  const result = await insforge.database
    .from("agent_runs")
    .update({
      browserbase_session_id: input.sessionId,
      browserbase_recording_url: input.recordingUrl,
    })
    .eq("id", input.runId)
    .eq("user_id", input.userId);

  if (result.error) {
    console.error("[agent/recording/save]", result.error);
  }
}
