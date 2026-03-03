import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "KENO80 — Provably Fair Keno Game",
  description:
    "Play Keno with provably fair draws. Select up to 10 numbers, place your bet, and win big with real-time draws every 60 seconds.",
  keywords: ["keno", "game", "provably fair", "betting"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-[#070e1a] text-white antialiased min-h-screen`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
