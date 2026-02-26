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
  },
  twitter: {
    card: "summary_large_image",
    title: "Tiny Pauses · Tiny mindful moments",
    description:
      "Tiny Pauses offers 2–3 minute, kid-friendly mindful prompts to help 9–12 year olds (and their grown‑ups) pause, notice, and reset. Learn more at tinypauses.com.",
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
