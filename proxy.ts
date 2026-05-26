import { NextRequest, NextResponse } from "next/server";

import { ACCESS_COOKIE, CSRF_COOKIE, REFRESH_COOKIE } from "@/lib/auth-cookies";

type RefreshResponse = {
  accessToken?: unknown;
  refreshToken?: unknown;
  csrfToken?: unknown;
};

const ACCESS_MAX_AGE_SECONDS = 60 * 15;
const REFRESH_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

function getCookieOptions(request: NextRequest): {
  httpOnly: true;
  secure: boolean;
  sameSite: "lax";
  path: "/";
} {
  return {
    httpOnly: true,
    secure: request.nextUrl.protocol === "https:",
    sameSite: "lax",
    path: "/",
  };
}

function getLoginRedirect(request: NextRequest): NextResponse {
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set(
    "next",
    `${request.nextUrl.pathname}${request.nextUrl.search}`,
  );
  return NextResponse.redirect(loginUrl);
}

function isRefreshResponse(value: unknown): value is RefreshResponse {
  return value !== null && typeof value === "object";
}

function clearSessionCookies(response: NextResponse): void {
  response.cookies.delete(ACCESS_COOKIE);
  response.cookies.delete(REFRESH_COOKIE);
  response.cookies.delete(CSRF_COOKIE);
}

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const hasAccessToken = Boolean(request.cookies.get(ACCESS_COOKIE)?.value);

  if (hasAccessToken) {
    return NextResponse.next();
  }

  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;

  if (!refreshToken) {
    return getLoginRedirect(request);
  }

  try {
    const baseUrl = process.env.NEXT_PUBLIC_INSFORGE_URL;
    const anonKey =
      process.env.INSFORGE_ANON_KEY ?? process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY;

    if (!baseUrl || !anonKey) {
      return getLoginRedirect(request);
    }

    const refreshResponse = await fetch(
      new URL("/api/auth/refresh?client_type=mobile", baseUrl),
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": anonKey,
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      },
    );

    if (!refreshResponse.ok) {
      const response = getLoginRedirect(request);
      clearSessionCookies(response);
      return response;
    }

    const payload: unknown = await refreshResponse.json();

    if (
      !isRefreshResponse(payload) ||
      typeof payload.accessToken !== "string"
    ) {
      const response = getLoginRedirect(request);
      clearSessionCookies(response);
      return response;
    }

    const response = NextResponse.redirect(request.url);
    const cookieOptions = getCookieOptions(request);

    response.cookies.set(ACCESS_COOKIE, payload.accessToken, {
      ...cookieOptions,
      maxAge: ACCESS_MAX_AGE_SECONDS,
    });

    if (typeof payload.refreshToken === "string") {
      response.cookies.set(REFRESH_COOKIE, payload.refreshToken, {
        ...cookieOptions,
        maxAge: REFRESH_MAX_AGE_SECONDS,
      });
    }

    if (typeof payload.csrfToken === "string") {
      response.cookies.set(CSRF_COOKIE, payload.csrfToken, {
        ...cookieOptions,
        maxAge: REFRESH_MAX_AGE_SECONDS,
      });
    }

    return response;
  } catch (error) {
    console.error("[proxy]", error);
    return getLoginRedirect(request);
  }
}

export const config = {
  matcher: ["/dashboard/:path*", "/profile/:path*", "/jobs/:path*"],
};
