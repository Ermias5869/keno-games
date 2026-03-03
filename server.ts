import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server as SocketIOServer } from "socket.io";
import { PrismaClient } from "@prisma/client";
import * as crypto from "crypto";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = parseInt(process.env.PORT || "3000", 10);
const socketPort = parseInt(process.env.SOCKET_PORT || "3001", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();
const prisma = new PrismaClient();

// ── Provably Fair helpers (duplicated to avoid import issues in custom server) ──
function generateServerSeed(): string {
  return crypto.randomBytes(32).toString("hex");
}

function hashSeed(seed: string): string {
  return crypto.createHash("sha256").update(seed).digest("hex");
}

function generateDraw(serverSeed: string, clientSeed: string): number[] {
  const hmac = crypto
    .createHmac("sha256", serverSeed)
    .update(clientSeed)
    .digest("hex");

  const numbers = Array.from({ length: 80 }, (_, i) => i + 1);

  for (let i = numbers.length - 1; i > 0; i--) {
    const hash = crypto
      .createHmac("sha256", serverSeed)
      .update(`${hmac}:${i}`)
      .digest();
    const entropy = hash.readUInt32BE(0);
    const j = entropy % (i + 1);
    [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
  }

  return numbers.slice(0, 20).sort((a, b) => a - b);
}

// ── Round Lifecycle Manager ──
const ROUND_INTERVAL = parseInt(process.env.ROUND_INTERVAL_SECONDS || "60", 10);

let currentRoundId: string | null = null;
let countdownSeconds = ROUND_INTERVAL;

async function startNewRound(io: SocketIOServer) {
  try {
    const serverSeed = generateServerSeed();
    const hash = hashSeed(serverSeed);

    const round = await prisma.gameRound.create({
      data: {
        serverSeed,
        hash,
        clientSeed: "",
        drawnNumbers: [],
        status: "betting",
      },
    });

    currentRoundId = round.id;
    countdownSeconds = ROUND_INTERVAL;

    console.log(`🎲 New round started: ${round.id}`);

    // Broadcast new round to all clients
    io.emit("round:new", {
      roundId: round.id,
      hash: round.hash,
    });
  } catch (error) {
    console.error("Failed to start new round:", error);
  }
}

async function resolveRound(io: SocketIOServer) {
  if (!currentRoundId) return;

  const roundId = currentRoundId;

  try {
    // Close betting
    await prisma.gameRound.update({
      where: { id: roundId },
      data: { status: "drawing" },
    });

    io.emit("round:bettingClosed");

    // Get the round
    const round = await prisma.gameRound.findUnique({
      where: { id: roundId },
    });

    if (!round) return;

    // Generate client seed and draw
    const clientSeed = `${Date.now()}-${roundId}`;
    const drawnNumbers = generateDraw(round.serverSeed, clientSeed);

    // Update round
    await prisma.gameRound.update({
      where: { id: roundId },
      data: {
        drawnNumbers,
        clientSeed,
        status: "completed",
      },
    });

    // Resolve all bets
    const bets = await prisma.bet.findMany({
      where: { roundId },
    });

    for (const bet of bets) {
      const matches = bet.selectedNumbers.filter((n: number) =>
        drawnNumbers.includes(n)
      ).length;

      // Get multiplier
      const multiplierRecord = await prisma.payoutMultiplier.findUnique({
        where: {
          selectedCount_matchCount: {
            selectedCount: bet.selectedNumbers.length,
            matchCount: matches,
          },
        },
      });

      const multiplier = multiplierRecord
        ? multiplierRecord.multiplier.toNumber()
        : 0;
      const payout = bet.betAmount.toNumber() * multiplier;

      // Update bet
      await prisma.bet.update({
        where: { id: bet.id },
        data: { matches, payout },
      });

      // Credit winnings
      if (payout > 0) {
        const updatedUser = await prisma.user.update({
          where: { id: bet.userId },
          data: { balance: { increment: payout } },
        });

        // Notify user of balance update
        io.emit("balance:update", {
          userId: bet.userId,
          balance: updatedUser.balance.toNumber(),
        });
      }
    }

    console.log(
      `✅ Round ${roundId} resolved: ${drawnNumbers.join(", ")} | ${bets.length} bets processed`
    );

    // Broadcast result
    io.emit("round:result", {
      roundId,
      drawnNumbers,
      serverSeed: round.serverSeed,
      hash: round.hash,
    });

    // Wait 8 seconds to show results, then start next round
    setTimeout(() => startNewRound(io), 8000);
  } catch (error) {
    console.error("Failed to resolve round:", error);
    // Try to start a new round anyway
    setTimeout(() => startNewRound(io), 5000);
  }
}

app.prepare().then(() => {
  // ── Next.js HTTP Server ──
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error("Error handling request:", err);
      res.statusCode = 500;
      res.end("Internal server error");
    }
  });

  httpServer.listen(port, () => {
    console.log(`🚀 Next.js server running on http://${hostname}:${port}`);
  });

  // ── Socket.io Server ──
  const io = new SocketIOServer(socketPort, {
    cors: {
      origin: `http://${hostname}:${port}`,
      methods: ["GET", "POST"],
    },
    transports: ["websocket", "polling"],
  });

  console.log(`🔌 Socket.io server running on port ${socketPort}`);

  io.on("connection", (socket) => {
    console.log(`👤 Client connected: ${socket.id}`);

    // Send current round info to newly connected client
    if (currentRoundId) {
      prisma.gameRound
        .findUnique({ where: { id: currentRoundId } })
        .then((round) => {
          if (round && round.status === "betting") {
            socket.emit("round:new", {
              roundId: round.id,
              hash: round.hash,
            });
            socket.emit("round:countdown", { seconds: countdownSeconds });
          }
        });
    }

    socket.on("disconnect", () => {
      console.log(`👤 Client disconnected: ${socket.id}`);
    });
  });

  // ── Countdown Timer ──
  setInterval(() => {
    if (countdownSeconds > 0) {
      countdownSeconds--;
      io.emit("round:countdown", { seconds: countdownSeconds });

      // When countdown reaches 0, resolve the round
      if (countdownSeconds === 0) {
        resolveRound(io);
      }
    }
  }, 1000);

  // Start the first round
  startNewRound(io);
});
