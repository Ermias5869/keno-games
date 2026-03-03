import { NextRequest, NextResponse } from "next/server";
import { RegisterSchema } from "@/modules/auth/auth.schema";
import { authService, AuthError } from "@/modules/auth/auth.service";
import { checkRateLimit, getClientIp } from "@/lib/utils/rate-limit";

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 5 registration attempts per minute per IP
    const ip = getClientIp(request);
    if (!checkRateLimit(`register:${ip}`, { maxRequests: 5, windowMs: 60_000 })) {
      return NextResponse.json(
        { error: "Too many registration attempts. Please try again later." },
        { status: 429 }
      );
    }

    const body = await request.json();

    // Validate input
    const result = RegisterSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { phone, password } = result.data;
    const data = await authService.register(phone, password);

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
