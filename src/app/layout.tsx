import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://tinypauses.com"),
  title: "Tiny Pauses · Tiny mindful moments",
  description:
    "Tiny Pauses offers 2–3 minute, kid-friendly mindful prompts to help 9–12 year olds (and their grown‑ups) pause, notice, and reset. Learn more at tinypauses.com.",
  alternates: {
    canonical: "https://tinypauses.com",
  },
  icons: {
    icon: "/brand/SmileFavicon.png",
    shortcut: "/brand/SmileFavicon.png",
    apple: "/brand/SmileFavicon.png",
  },
  openGraph: {
    title: "Tiny Pauses · Tiny mindful moments",
    description:
      "Tiny Pauses offers 2–3 minute, kid-friendly mindful prompts to help 9–12 year olds (and their grown‑ups) pause, notice, and reset. Learn more at tinypauses.com.",
    url: "https://tinypauses.com",
    siteName: "Tiny Pauses",
    type: "website",
    images: [
      {
        url: "https://tinypauses.com/brand/LogoLockUp.png",
        width: 1200,
        height: 630,
        alt: "Tiny Pauses",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Tiny Pauses · Tiny mindful moments",
    description:
      "Tiny Pauses offers 2–3 minute, kid-friendly mindful prompts to help 9–12 year olds (and their grown‑ups) pause, notice, and reset. Learn more at tinypauses.com.",
    images: ["https://tinypauses.com/brand/LogoLockUp.png"],
  },
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
