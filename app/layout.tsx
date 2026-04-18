import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dota 2 Knowledge Game",
  description: "Monopoly-style Dota 2 trivia battle",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-950 text-white min-h-screen">{children}</body>
    </html>
  );
}
