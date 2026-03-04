import { NextRequest } from "next/server";
import { SignJWT, jwtVerify, JWTPayload } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback-secret"
);
const JWT_REFRESH_SECRET = new TextEncoder().encode(
  process.env.JWT_REFRESH_SECRET || "fallback-refresh-secret"
);

export interface TokenPayload extends JWTPayload {
  userId: string;
  role: string;
}

/** Sign an access token (15 minute expiry) */
export async function signAccessToken(payload: {
  userId: string;
  role: string;
}): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(JWT_SECRET);
}

/** Sign a refresh token (7 day expiry) */
export async function signRefreshToken(payload: {
  userId: string;
  role: string;
}): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_REFRESH_SECRET);
}

/** Verify an access token */
export async function verifyAccessToken(
  token: string
): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as TokenPayload;
  } catch {
    return null;
  }
}

/** Verify a refresh token */
export async function verifyRefreshToken(
  token: string
): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_REFRESH_SECRET);
    return payload as TokenPayload;
  } catch {
    return null;
  }
}

/** 
 * Helper to verify auth in API routes.
 * Extracts Bearer token and returns payload if valid.
 */
export async function verifyAuth(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.split(" ")[1];
  const payload = await verifyAccessToken(token);
  
  if (!payload) return null;
  
  return {
    id: payload.userId,
    role: payload.role,
  };
}
