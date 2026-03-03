import {
  generateServerSeed,
  hashSeed,
  generateDraw,
} from "@/lib/crypto/provably-fair";
import { gameRepository, GameError } from "./game.repository";

export const gameService = {
  /**
   * Start a new game round.
   * Generates server seed, hashes it (published before draw),
   * and creates a round in "betting" status.
   */
  async startNewRound() {
    const serverSeed = generateServerSeed();
    const hash = hashSeed(serverSeed);

    const round = await gameRepository.createRound({
      serverSeed,
      hash,
    });

    // Return hash (public) but NOT the serverSeed (revealed after draw)
    return {
      id: round.id,
      hash: round.hash,
      status: round.status,
      createdAt: round.createdAt,
    };
  },

  /**
   * Place a bet in the current round.
   * Validates balance, deducts amount, creates bet record.
   */
  async placeBet(
    userId: string,
    selectedNumbers: number[],
    betAmount: number,
    roundId: string
  ) {
    const bet = await gameRepository.placeBet({
      userId,
      roundId,
      selectedNumbers,
      betAmount,
    });

    return {
      id: bet.id,
      selectedNumbers: bet.selectedNumbers,
      betAmount: bet.betAmount,
      roundId: bet.roundId,
    };
  },

  /**
   * Resolve a round:
   * 1. Close betting
   * 2. Generate client seed (timestamp-based for simplicity)
   * 3. Generate deterministic draw from seeds
   * 4. Calculate all bet payouts
   * 5. Update balances
   * 6. Mark round as completed
   */
  async resolveRound(roundId: string) {
    // Mark as drawing (no more bets accepted)
    await gameRepository.updateRound(roundId, { status: "drawing" });

    // Get the full round data
    const round = await gameRepository.getRoundById(roundId);
    if (!round) {
      throw new GameError("Round not found", 404);
    }

    // Generate client seed (using current timestamp + round ID for uniqueness)
    const clientSeed = `${Date.now()}-${roundId}`;

    // Generate the draw using provably fair algorithm
    const drawnNumbers = generateDraw(round.serverSeed, clientSeed);

    // Update round with drawn numbers and client seed
    await gameRepository.updateRound(roundId, {
      drawnNumbers,
      clientSeed,
      status: "completed",
    });

    // Resolve all bets for this round (calculate matches & payouts)
    await gameRepository.resolveRoundBets(roundId, drawnNumbers);

    return {
      roundId,
      drawnNumbers,
      serverSeed: round.serverSeed, // Now revealed since round is over
      clientSeed,
      hash: round.hash,
    };
  },

  /** Get the currently active round */
  async getCurrentRound() {
    const round = await gameRepository.getCurrentRound();
    if (!round) {
      return null;
    }
    return {
      id: round.id,
      hash: round.hash,
      status: round.status,
      createdAt: round.createdAt,
    };
  },

  /** Get the payout multiplier table */
  async getPayoutTable() {
    return gameRepository.getPayoutTable();
  },

  /** Get a user's bet history */
  async getBetHistory(userId: string) {
    return gameRepository.getUserBets(userId);
  },

  /** Get leaderboard of top wins */
  async getLeaderboard() {
    return gameRepository.getLeaderboard();
  },

  /** Get daily statistics */
  async getDailyStats() {
    return gameRepository.getDailyStats();
  },
};

export { GameError };
