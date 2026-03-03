import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken, TokenPayload } from "./jwt";

/**
 * Extract and verify JWT from Authorization header.
 * Returns the decoded payload or a 401 response.
 */
export async function authenticateRequest(
  request: NextRequest
): Promise<TokenPayload | NextResponse> {
  const authHeader = request.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "Missing or invalid authorization header" },
      { status: 401 }
    );
  }

  const token = authHeader.split(" ")[1];
  const payload = await verifyAccessToken(token);

  if (!payload) {
    return NextResponse.json(
      { error: "Invalid or expired token" },
      { status: 401 }
    );
  }

  return payload;
}

/**
 * Check if the authenticated user has admin role.
 * Must be called AFTER authenticateRequest.
 */
export function requireAdmin(
  payload: TokenPayload
): NextResponse | null {
  if (payload.role !== "admin") {
    return NextResponse.json(
      { error: "Admin access required" },
      { status: 403 }
    );
  }
  return null;
}
