import bcrypt from "bcryptjs";
import { authRepository } from "./auth.repository";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "@/lib/auth/jwt";

const SALT_ROUNDS = 12;

export const authService = {
  /**
   * Register a new user with phone + password.
   * Returns access and refresh tokens on success.
   */
  async register(phone: string, password: string) {
    // Check if user already exists
    const existingUser = await authRepository.findByPhone(phone);
    if (existingUser) {
      throw new AuthError("Phone number already registered", 409);
    }

    // Hash password with bcrypt
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Create user in database
    const user = await authRepository.createUser({
      phone,
      password: hashedPassword,
    });

    // Generate tokens
    const [accessToken, refreshToken] = await Promise.all([
      signAccessToken({ userId: user.id, role: user.role }),
      signRefreshToken({ userId: user.id, role: user.role }),
    ]);

    return {
      user: {
        id: user.id,
        phone: user.phone,
        balance: user.balance,
        role: user.role,
      },
      accessToken,
      refreshToken,
    };
  },

  /**
   * Authenticate user with phone + password.
   * Returns access and refresh tokens on success.
   */
  async login(phone: string, password: string) {
    const user = await authRepository.findByPhone(phone);
    if (!user) {
      throw new AuthError("Invalid phone number or password", 401);
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      throw new AuthError("Invalid phone number or password", 401);
    }

    // Generate tokens
    const [accessToken, refreshToken] = await Promise.all([
      signAccessToken({ userId: user.id, role: user.role }),
      signRefreshToken({ userId: user.id, role: user.role }),
    ]);

    return {
      user: {
        id: user.id,
        phone: user.phone,
        balance: user.balance,
        role: user.role,
      },
      accessToken,
      refreshToken,
    };
  },

  /**
   * Refresh access token using a valid refresh token.
   * Returns new access and refresh tokens.
   */
  async refresh(refreshTokenStr: string) {
    const payload = await verifyRefreshToken(refreshTokenStr);
    if (!payload) {
      throw new AuthError("Invalid or expired refresh token", 401);
    }

    // Verify user still exists
    const user = await authRepository.findById(payload.userId);
    if (!user) {
      throw new AuthError("User not found", 401);
    }

    // Generate new token pair
    const [accessToken, refreshToken] = await Promise.all([
      signAccessToken({ userId: user.id, role: user.role }),
      signRefreshToken({ userId: user.id, role: user.role }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  },

  /** Get current user profile */
  async getProfile(userId: string) {
    const user = await authRepository.findById(userId);
    if (!user) {
      throw new AuthError("User not found", 404);
    }
    return user;
  },
};

/** Custom error class for auth errors with HTTP status */
export class AuthError extends Error {
  constructor(
    message: string,
    public statusCode: number
  ) {
    super(message);
    this.name = "AuthError";
  }
}
