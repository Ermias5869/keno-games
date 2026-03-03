import * as crypto from "crypto";

/**
 * Provably fair system for Keno draws.
 *
 * Flow:
 * 1. Server generates a serverSeed and hashes it (SHA-256)
 * 2. Hash is published/stored BEFORE the draw
 * 3. After betting closes, the draw is generated deterministically from serverSeed + clientSeed
 * 4. Anyone can verify: hash(serverSeed) === published hash
 */

/** Generate a cryptographically secure server seed */
export function generateServerSeed(): string {
  return crypto.randomBytes(32).toString("hex");
}

/** Hash a seed using SHA-256 */
export function hashSeed(seed: string): string {
  return crypto.createHash("sha256").update(seed).digest("hex");
}

/**
 * Generate a deterministic draw of 20 unique numbers from 1-80
 * using HMAC-SHA256(serverSeed, clientSeed) as the entropy source.
 *
 * Uses a deterministic Fisher-Yates shuffle seeded by the HMAC output.
 */
export function generateDraw(
  serverSeed: string,
  clientSeed: string
): number[] {
  // Create HMAC for deterministic randomness
  const hmac = crypto
    .createHmac("sha256", serverSeed)
    .update(clientSeed)
    .digest("hex");

  // Build array 1-80
  const numbers = Array.from({ length: 80 }, (_, i) => i + 1);

  // Fisher-Yates shuffle using HMAC bytes as entropy
  // We need 80 random values; the HMAC gives us 32 bytes = 64 hex chars
  // We'll use multiple rounds of HMAC with an index suffix to get enough entropy
  for (let i = numbers.length - 1; i > 0; i--) {
    const entropy = getEntropyAt(hmac, serverSeed, i);
    const j = entropy % (i + 1);
    [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
  }

  // Take first 20 numbers from the shuffled array
  return numbers.slice(0, 20).sort((a, b) => a - b);
}

/**
 * Get a deterministic random number at a given index.
 * Uses HMAC chaining to generate enough entropy for all 80 positions.
 */
function getEntropyAt(
  baseHmac: string,
  serverSeed: string,
  index: number
): number {
  const hash = crypto
    .createHmac("sha256", serverSeed)
    .update(`${baseHmac}:${index}`)
    .digest();

  // Read 4 bytes as unsigned 32-bit integer for good distribution
  return hash.readUInt32BE(0);
}

/**
 * Verify that a given serverSeed matches the published hash.
 * This allows players to verify the draw was fair.
 */
export function verifyFairness(serverSeed: string, hash: string): boolean {
  return hashSeed(serverSeed) === hash;
}

/**
 * Generate a secure random integer between min (inclusive) and max (inclusive).
 * Uses crypto.randomInt for cryptographic security.
 */
export function secureRandomInt(min: number, max: number): number {
  return crypto.randomInt(min, max + 1);
}
