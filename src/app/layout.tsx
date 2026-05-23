import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ServiceWorkerRegister } from "./service-worker-register";

export const viewport: Viewport = {
  themeColor: "#faf8f5",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://tinypauses.com"),
  title: "Tiny Pauses · Tiny mindful moments",
  description:
    "Tiny Pauses offers 2–3 minute, kid-friendly mindful prompts to help 9–12 year olds (and their grown‑ups) pause, notice, and reset. Learn more at tinypauses.com.",
  applicationName: "Tiny Pauses",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Tiny Pauses",
  },
  alternates: {
    canonical: "https://tinypauses.com",
  },
  icons: {
    icon: "/brand/SmileFavicon.png",
    shortcut: "/brand/SmileFavicon.png",
    apple: "/icons/apple-touch-icon.png",
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
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
