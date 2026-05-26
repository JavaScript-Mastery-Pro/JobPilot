"use server";

import { redirect } from "next/navigation";

import {
  type AuthProvider,
  clearAuthCookies,
  getAccessToken,
  getLoginUrl,
  getRequestAppUrl,
  getSafeInternalPath,
  setCodeVerifierCookie,
  setOAuthNextCookie,
} from "@/lib/auth";
import { createInsforgeServer } from "@/lib/insforge-server";

export async function startOAuth(
  provider: AuthProvider,
  formData: FormData,
): Promise<void> {
  let oauthUrl: string | undefined;
  let codeVerifier: string | undefined;
  const nextPath = getSafeInternalPath(formData.get("next"));

  try {
    const insforge = createInsforgeServer();
    const appUrl = await getRequestAppUrl();
    const redirectTo = new URL("/api/auth/callback", appUrl).toString();

    const { data, error } = await insforge.auth.signInWithOAuth({
      provider,
      redirectTo,
      skipBrowserRedirect: true,
    });

    if (error || !data.url || !data.codeVerifier) {
      console.error("[actions/auth/startOAuth]", error);
    } else {
      oauthUrl = data.url;
      codeVerifier = data.codeVerifier;
    }
  } catch (error) {
    console.error("[actions/auth/startOAuth]", error);
  }

  if (!oauthUrl || !codeVerifier) {
    redirect(getLoginUrl("oauth_init_failed"));
  }

  const appUrl = await getRequestAppUrl();
  await setCodeVerifierCookie(codeVerifier, appUrl);
  await setOAuthNextCookie(nextPath, appUrl);
  redirect(oauthUrl);
}

export async function signOut(): Promise<void> {
  const accessToken = await getAccessToken({ persistCookies: true });

  if (accessToken) {
    try {
      const insforge = createInsforgeServer(accessToken);
      const { error } = await insforge.auth.signOut();

      if (error) {
        console.error("[actions/auth/signOut]", error);
      }
    } catch (error) {
      console.error("[actions/auth/signOut]", error);
    }
  }

  await clearAuthCookies();
  redirect("/");
}
