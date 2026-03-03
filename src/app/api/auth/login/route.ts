import { NextRequest, NextResponse } from "next/server";
import { LoginSchema } from "@/modules/auth/auth.schema";
import { authService, AuthError } from "@/modules/auth/auth.service";
import { checkRateLimit, getClientIp } from "@/lib/utils/rate-limit";

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 10 login attempts per minute per IP
    const ip = getClientIp(request);
    if (!checkRateLimit(`login:${ip}`, { maxRequests: 10, windowMs: 60_000 })) {
      return NextResponse.json(
        { error: "Too many login attempts. Please try again later." },
        { status: 429 }
      );
    }

    const body = await request.json();

    // Validate input
    const result = LoginSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { phone, password } = result.data;
    const data = await authService.login(phone, password);

    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
