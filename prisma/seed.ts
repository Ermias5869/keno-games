import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

/**
 * Default payout multiplier table for Keno.
 * Format: [selectedCount, matchCount, multiplier]
 * 
 * These are standard Keno multipliers — can be adjusted via admin panel.
 */
const PAYOUT_TABLE: [number, number, number][] = [
  // 1 pick
  [1, 0, 0], [1, 1, 3],
  // 2 picks
  [2, 0, 0], [2, 1, 1], [2, 2, 9],
  // 3 picks
  [3, 0, 0], [3, 1, 0], [3, 2, 2], [3, 3, 26],
  // 4 picks
  [4, 0, 0], [4, 1, 0], [4, 2, 1], [4, 3, 5], [4, 4, 72],
  // 5 picks
  [5, 0, 0], [5, 1, 0], [5, 2, 0], [5, 3, 3], [5, 4, 15], [5, 5, 200],
  // 6 picks
  [6, 0, 0], [6, 1, 0], [6, 2, 0], [6, 3, 2], [6, 4, 6], [6, 5, 50], [6, 6, 500],
  // 7 picks
  [7, 0, 0], [7, 1, 0], [7, 2, 0], [7, 3, 1], [7, 4, 4], [7, 5, 20], [7, 6, 100], [7, 7, 1000],
  // 8 picks
  [8, 0, 0], [8, 1, 0], [8, 2, 0], [8, 3, 0], [8, 4, 3], [8, 5, 10], [8, 6, 50], [8, 7, 300], [8, 8, 2000],
  // 9 picks
  [9, 0, 0], [9, 1, 0], [9, 2, 0], [9, 3, 0], [9, 4, 2], [9, 5, 5], [9, 6, 30], [9, 7, 100], [9, 8, 1000], [9, 9, 5000],
  // 10 picks
  [10, 0, 0], [10, 1, 0], [10, 2, 0], [10, 3, 0], [10, 4, 1], [10, 5, 3], [10, 6, 15], [10, 7, 50], [10, 8, 300], [10, 9, 2000], [10, 10, 10000],
];

async function main() {
  console.log("🌱 Seeding database...");

  // Seed payout multipliers
  console.log("📊 Seeding payout multiplier table...");
  for (const [selectedCount, matchCount, multiplier] of PAYOUT_TABLE) {
    await prisma.payoutMultiplier.upsert({
      where: {
        selectedCount_matchCount: { selectedCount, matchCount },
      },
      update: { multiplier },
      create: { selectedCount, matchCount, multiplier },
    });
  }
  console.log(`   ✅ Seeded ${PAYOUT_TABLE.length} payout entries`);

  // Create admin user
  console.log("👤 Creating admin user...");
  const adminPhone = "+1234567890";
  const adminPassword = await bcrypt.hash("admin123", 12);

  await prisma.user.upsert({
    where: { phone: adminPhone },
    update: {},
    create: {
      phone: adminPhone,
      password: adminPassword,
      role: "admin",
      balance: 100000, // Admin gets a large starting balance for testing
    },
  });
  console.log(`   ✅ Admin user created (phone: ${adminPhone}, password: admin123)`);

  // Create a test player
  console.log("👤 Creating test player...");
  const playerPhone = "+9876543210";
  const playerPassword = await bcrypt.hash("player123", 12);

  await prisma.user.upsert({
    where: { phone: playerPhone },
    update: {},
    create: {
      phone: playerPhone,
      password: playerPassword,
      role: "user",
      balance: 1000, // Starting balance for testing
    },
  });
  console.log(`   ✅ Test player created (phone: ${playerPhone}, password: player123)`);

  console.log("\n🎉 Seeding complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
