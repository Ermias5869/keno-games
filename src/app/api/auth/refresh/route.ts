import { NextRequest, NextResponse } from "next/server";
import { RefreshSchema } from "@/modules/auth/auth.schema";
import { authService, AuthError } from "@/modules/auth/auth.service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const result = RefreshSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { refreshToken } = result.data;
    const data = await authService.refresh(refreshToken);

    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    console.error("Refresh error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
