import "server-only";

import type { UserSchema } from "@insforge/sdk";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import { createInsforgeServer } from "@/lib/insforge-server";
import {
  ACCESS_COOKIE,
  CODE_VERIFIER_COOKIE,
  CSRF_COOKIE,
  OAUTH_NEXT_COOKIE,
  REFRESH_COOKIE,
} from "@/lib/auth-cookies";

export {
  ACCESS_COOKIE,
  CODE_VERIFIER_COOKIE,
  CSRF_COOKIE,
  OAUTH_NEXT_COOKIE,
  REFRESH_COOKIE,
} from "@/lib/auth-cookies";

const ACCESS_MAX_AGE_SECONDS = 60 * 15;
const REFRESH_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;
const CODE_VERIFIER_MAX_AGE_SECONDS = 60 * 10;

export function shouldUseSecureCookies(appUrl: string = getAppUrl()): boolean {
  try {
    return new URL(appUrl).protocol === "https:";
  } catch (error) {
    console.error("[auth/shouldUseSecureCookies]", error);
    return process.env.NODE_ENV === "production";
  }
}

function getCookieOptions(appUrl?: string): {
  httpOnly: true;
  secure: boolean;
  sameSite: "lax";
  path: "/";
} {
  return {
    httpOnly: true,
    secure: shouldUseSecureCookies(appUrl),
    sameSite: "lax",
    path: "/",
  };
}

export type AuthProvider = "google" | "github";

export function getAppUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return "http://localhost:3000";
}

export async function getRequestAppUrl(): Promise<string> {
  const headerStore = await headers();
  const forwardedHost = headerStore.get("x-forwarded-host");
  const host = forwardedHost ?? headerStore.get("host");

  if (!host) {
    return getAppUrl();
  }

  const forwardedProto = headerStore.get("x-forwarded-proto");
  const protocol =
    forwardedProto ?? (host.startsWith("localhost:") ? "http" : "https");

  return `${protocol}://${host}`;
}

export function getLoginUrl(error?: string): string {
  if (!error) {
    return "/login";
  }

  return `/login?error=${encodeURIComponent(error)}`;
}

export function getSafeInternalPath(value: FormDataEntryValue | null): string {
  if (typeof value !== "string") {
    return "/dashboard";
  }

  if (!value.startsWith("/") || value.startsWith("//")) {
    return "/dashboard";
  }

  return value;
}

export async function setCodeVerifierCookie(
  codeVerifier: string,
  appUrl?: string,
): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.set(CODE_VERIFIER_COOKIE, codeVerifier, {
    ...getCookieOptions(appUrl),
    maxAge: CODE_VERIFIER_MAX_AGE_SECONDS,
  });
}

export async function setOAuthNextCookie(
  nextPath: string,
  appUrl?: string,
): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.set(OAUTH_NEXT_COOKIE, nextPath, {
    ...getCookieOptions(appUrl),
    maxAge: CODE_VERIFIER_MAX_AGE_SECONDS,
  });
}

export async function setAuthCookies(input: {
  accessToken: string;
  refreshToken?: string;
  csrfToken?: string | null;
}): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.set(ACCESS_COOKIE, input.accessToken, {
    ...getCookieOptions(),
    maxAge: ACCESS_MAX_AGE_SECONDS,
  });

  if (input.refreshToken) {
    cookieStore.set(REFRESH_COOKIE, input.refreshToken, {
      ...getCookieOptions(),
      maxAge: REFRESH_MAX_AGE_SECONDS,
    });
  }

  if (input.csrfToken) {
    cookieStore.set(CSRF_COOKIE, input.csrfToken, {
      ...getCookieOptions(),
      maxAge: REFRESH_MAX_AGE_SECONDS,
    });
  }
}

async function trySetAuthCookies(input: {
  accessToken: string;
  refreshToken?: string;
  csrfToken?: string | null;
}): Promise<void> {
  try {
    await setAuthCookies(input);
  } catch (error) {
    console.error("[auth/trySetAuthCookies]", error);
  }
}

export async function clearAuthCookies(): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.delete(ACCESS_COOKIE);
  cookieStore.delete(REFRESH_COOKIE);
  cookieStore.delete(CSRF_COOKIE);
  cookieStore.delete(CODE_VERIFIER_COOKIE);
  cookieStore.delete(OAUTH_NEXT_COOKIE);
}

async function tryClearAuthCookies(): Promise<void> {
  try {
    await clearAuthCookies();
  } catch (error) {
    console.error("[auth/tryClearAuthCookies]", error);
  }
}

async function getRefreshToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(REFRESH_COOKIE)?.value ?? null;
}

type AuthReadOptions = {
  persistCookies?: boolean;
};

async function refreshAuthSession(options: AuthReadOptions = {}): Promise<{
  accessToken: string;
  user: UserSchema | null;
} | null> {
  const refreshToken = await getRefreshToken();

  if (!refreshToken) {
    return null;
  }

  try {
    const insforge = createInsforgeServer();
    const { data, error } = await insforge.auth.refreshSession({
      refreshToken,
    });

    if (error || !data?.accessToken) {
      if (error) {
        console.error("[auth/refreshAuthSession]", error);
      }

      if (options.persistCookies === true) {
        await tryClearAuthCookies();
      }
      return null;
    }

    if (options.persistCookies === true) {
      await trySetAuthCookies({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        csrfToken: data.csrfToken,
      });
    }

    return {
      accessToken: data.accessToken,
      user: data.user ?? null,
    };
  } catch (error) {
    console.error("[auth/refreshAuthSession]", error);
    return null;
  }
}

export async function getAccessToken(
  options: AuthReadOptions = {},
): Promise<string | null> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_COOKIE)?.value ?? null;

  if (accessToken) {
    return accessToken;
  }

  const refreshedSession = await refreshAuthSession(options);
  return refreshedSession?.accessToken ?? null;
}

export async function getCurrentUser(
  options: AuthReadOptions = {},
): Promise<UserSchema | null> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_COOKIE)?.value ?? null;

  if (!accessToken) {
    const refreshedSession = await refreshAuthSession(options);
    return refreshedSession?.user ?? null;
  }

  try {
    const insforge = createInsforgeServer(accessToken);
    const { data, error } = await insforge.auth.getCurrentUser();

    if (error || !data.user) {
      const refreshedSession = await refreshAuthSession(options);
      return refreshedSession?.user ?? null;
    }

    return data.user;
  } catch (error) {
    console.error("[auth/getCurrentUser]", error);
    return null;
  }
}

export async function requireCurrentUser(): Promise<UserSchema> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}
