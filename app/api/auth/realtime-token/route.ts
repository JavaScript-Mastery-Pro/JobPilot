import { NextResponse } from "next/server";

import { getAccessToken, getCurrentUser } from "@/lib/auth";

type ApiResponse =
  | {
      success: true;
      data: {
        accessToken: string;
      };
    }
  | {
      success: false;
      error: string;
    };

function jsonResponse(body: ApiResponse, status: number): NextResponse {
  return NextResponse.json(body, { status });
}

export async function GET(): Promise<NextResponse> {
  try {
    const accessToken = await getAccessToken({ persistCookies: true });
    const user = await getCurrentUser({ persistCookies: true });

    if (!user || !accessToken) {
      return jsonResponse(
        { success: false, error: "Sign in again to view live agent logs." },
        401,
      );
    }

    return jsonResponse(
      {
        success: true,
        data: {
          accessToken,
        },
      },
      200,
    );
  } catch (error) {
    console.error("[auth/realtime-token]", error);
    return jsonResponse(
      { success: false, error: "Could not connect to live agent logs." },
      500,
    );
  }
}
