import { NextRequest, NextResponse } from "next/server";

import {
  ACCESS_COOKIE,
  CODE_VERIFIER_COOKIE,
  CSRF_COOKIE,
  OAUTH_NEXT_COOKIE,
  REFRESH_COOKIE,
} from "@/lib/auth-cookies";
import { getLoginUrl, shouldUseSecureCookies } from "@/lib/auth";
import { createInsforgeServer } from "@/lib/insforge-server";

type AuthTokens = {
  accessToken: string;
  refreshToken?: string;
  csrfToken?: string | null;
};

type ProfileCompletionRow = {
  is_complete?: unknown;
};

function getSafeRedirectPath(value: string | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/dashboard";
  }

  return value;
}

function isProfileCompletionRow(value: unknown): value is ProfileCompletionRow {
  return value !== null && typeof value === "object";
}

function getRequestAppUrl(request: NextRequest): string {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = forwardedHost ?? request.headers.get("host");

  if (!host) {
    return request.nextUrl.origin;
  }

  const forwardedProto = request.headers.get("x-forwarded-proto");
  const protocol =
    forwardedProto ?? (host.startsWith("localhost:") ? "http" : "https");

  return `${protocol}://${host}`;
}

function createAuthenticatedRedirect(
  request: NextRequest,
  redirectPath: string,
  tokens: AuthTokens,
): NextResponse {
  const response = NextResponse.redirect(new URL(redirectPath, request.url));
  const appUrl = getRequestAppUrl(request);
  const accessCookieOptions = {
    httpOnly: true,
    secure: shouldUseSecureCookies(appUrl),
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 15,
  };
  const refreshCookieOptions = {
    httpOnly: true,
    secure: shouldUseSecureCookies(appUrl),
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  };

  response.cookies.set(ACCESS_COOKIE, tokens.accessToken, accessCookieOptions);

  if (tokens.refreshToken) {
    response.cookies.set(
      REFRESH_COOKIE,
      tokens.refreshToken,
      refreshCookieOptions,
    );
  }

  if (tokens.csrfToken) {
    response.cookies.set(CSRF_COOKIE, tokens.csrfToken, refreshCookieOptions);
  }

  response.cookies.delete(CODE_VERIFIER_COOKIE);
  response.cookies.delete(OAUTH_NEXT_COOKIE);
  return response;
}

async function getSmartRedirectPath(
  accessToken: string,
  nextPath: string | undefined,
): Promise<string> {
  try {
    const insforge = createInsforgeServer(accessToken);
    const userResult = await insforge.auth.getCurrentUser();

    if (userResult.error || !userResult.data.user) {
      console.error("[api/auth/callback]", userResult.error);
      return "/profile";
    }

    const profileResult = await insforge.database
      .from("profiles")
      .select("is_complete")
      .eq("id", userResult.data.user.id)
      .maybeSingle();

    if (profileResult.error) {
      console.error("[api/auth/callback]", profileResult.error);
      return "/profile";
    }

    const profile = isProfileCompletionRow(profileResult.data)
      ? profileResult.data
      : null;

    if (profile?.is_complete !== true) {
      return "/profile";
    }

    return getSafeRedirectPath(nextPath);
  } catch (error) {
    console.error("[api/auth/callback]", error);
    return "/profile";
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const code = request.nextUrl.searchParams.get("insforge_code");
    const callbackError = request.nextUrl.searchParams.get("error");

    if (callbackError || !code) {
      return NextResponse.redirect(
        new URL(getLoginUrl(callbackError ?? "oauth_failed"), request.url),
      );
    }

    const codeVerifier = request.cookies.get(CODE_VERIFIER_COOKIE)?.value;

    if (!codeVerifier) {
      return NextResponse.redirect(
        new URL(getLoginUrl("missing_verifier"), request.url),
      );
    }

    const insforge = createInsforgeServer();
    const { data, error } = await insforge.auth.exchangeOAuthCode(
      code,
      codeVerifier,
    );

    if (error || !data?.accessToken) {
      console.error("[api/auth/callback]", error);
      return NextResponse.redirect(
        new URL(getLoginUrl("exchange_failed"), request.url),
      );
    }

    const nextPath = request.cookies.get(OAUTH_NEXT_COOKIE)?.value;
    const redirectPath = await getSmartRedirectPath(
      data.accessToken,
      nextPath,
    );

    return createAuthenticatedRedirect(request, redirectPath, {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      csrfToken: data.csrfToken,
    });
  } catch (error) {
    console.error("[api/auth/callback]", error);
    return NextResponse.redirect(
      new URL(getLoginUrl("callback_failed"), request.url),
    );
  }
}
