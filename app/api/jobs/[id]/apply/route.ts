import { NextResponse } from "next/server";

type ApiResponse =
  | {
      success: true;
      data: {
        applied: boolean;
      };
    }
  | {
      success: false;
      error: string;
    };

function jsonResponse(body: ApiResponse, status: number): NextResponse {
  return NextResponse.json(body, { status });
}

export async function POST(
  _request: Request,
  _context: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  return jsonResponse(
    {
      success: false,
      error:
        "Automatic application submission is disabled. Tailor your resume and apply from the saved job link.",
    },
    410,
  );
}
