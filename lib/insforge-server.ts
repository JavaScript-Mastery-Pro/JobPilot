import { createClient } from "@insforge/sdk";

export function createInsforgeServer(accessToken?: string) {
  const baseUrl = process.env.NEXT_PUBLIC_INSFORGE_URL;
  const anonKey =
    process.env.INSFORGE_ANON_KEY ?? process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY;

  if (!baseUrl || !anonKey) {
    throw new Error("Missing InsForge environment variables.");
  }

  return createClient({
    baseUrl,
    anonKey,
    edgeFunctionToken: accessToken,
    isServerMode: true,
  });
}
