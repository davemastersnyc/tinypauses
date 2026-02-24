import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Practice · Tiny mindful moments",
  description:
    "2–3 minute, kid-friendly mindful prompts to help 9–12 year olds (and their grown‑ups) pause, notice, and reset.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
