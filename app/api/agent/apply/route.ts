import { NextResponse } from "next/server";

type ApiResponse =
  | {
      success: true;
      data: {
        appliedJobs: number;
        failedJobs: number;
      };
    }
  | {
      success: false;
      error: string;
    };

function jsonResponse(body: ApiResponse, status: number): NextResponse {
  return NextResponse.json(body, { status });
}

export async function POST(): Promise<NextResponse> {
  return jsonResponse(
    {
      success: false,
      error:
        "Automatic application submission is disabled. Review the match score and use the saved job links manually.",
    },
    410,
  );
}
