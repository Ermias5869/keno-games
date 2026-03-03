import axios, { AxiosInstance } from "axios";
import {
  ChapaInitializeRequest,
  ChapaInitializeResponse,
  ChapaVerifyResponse,
} from "./types";

const CHAPA_API_URL = "https://api.chapa.co/v1";

/**
 * ChapaService — handles all communication with the Chapa API.
 * All Chapa API calls go through this service.
 */
class ChapaService {
  private client: AxiosInstance;

  constructor() {
    const secretKey = process.env.CHAPA_SECRET_KEY;
    if (!secretKey) {
      console.warn("⚠️ CHAPA_SECRET_KEY is not set in environment variables");
    }

    this.client = axios.create({
      baseURL: CHAPA_API_URL,
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
      timeout: 30_000, // 30 second timeout
    });
  }

  /**
   * Initialize a payment transaction with Chapa.
   * Returns the checkout URL for the user to complete payment.
   */
  async initialize(
    data: ChapaInitializeRequest
  ): Promise<ChapaInitializeResponse> {
    try {
      const response = await this.client.post<ChapaInitializeResponse>(
        "/transaction/initialize",
        data
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message =
          error.response?.data?.message || "Failed to initialize Chapa payment";
        console.error("Chapa initialize error:", {
          status: error.response?.status,
          data: error.response?.data,
        });
        throw new ChapaError(message, error.response?.status || 500);
      }
      throw error;
    }
  }

  /**
   * Verify a transaction by its tx_ref.
   * CRITICAL: Always verify server-side before crediting balance.
   */
  async verify(txRef: string): Promise<ChapaVerifyResponse> {
    try {
      const response = await this.client.get<ChapaVerifyResponse>(
        `/transaction/verify/${txRef}`
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message =
          error.response?.data?.message ||
          "Failed to verify Chapa transaction";
        console.error("Chapa verify error:", {
          status: error.response?.status,
          data: error.response?.data,
          txRef,
        });
        throw new ChapaError(message, error.response?.status || 500);
      }
      throw error;
    }
  }

  /**
   * Verify the webhook signature from Chapa.
   * Compares the Chapa-Signature header against the webhook secret.
   */
  verifyWebhookSignature(
    signature: string | null
  ): boolean {
    const webhookSecret = process.env.CHAPA_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.warn("⚠️ CHAPA_WEBHOOK_SECRET not set — skipping signature verification");
      // In production, you should ALWAYS verify signatures
      return true;
    }

    if (!signature) {
      console.error("Missing Chapa-Signature header");
      return false;
    }

    // Chapa sends the webhook secret hash in the header
    // Compare directly with the stored secret
    return signature === webhookSecret;
  }
}

/** Custom error class for Chapa API errors */
export class ChapaError extends Error {
  constructor(
    message: string,
    public statusCode: number
  ) {
    super(message);
    this.name = "ChapaError";
  }
}

// Export a singleton instance
export const chapaService = new ChapaService();
