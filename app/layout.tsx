import type { Metadata, Viewport } from "next";
import "@fontsource/barlow-condensed/latin-700.css";
import "@fontsource/barlow-condensed/latin-800.css";
import "@fontsource/barlow-condensed/latin-900.css";
import "@fontsource/manrope/latin-400.css";
import "@fontsource/manrope/latin-700.css";
import "@fontsource/manrope/latin-800.css";
import "./globals.css";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://pickle-king.openai-sites.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Pickle King — Run the court. Crown the best.",
    template: "%s · Pickle King",
  },
  description:
    "A private, offline-first pickleball tournament director and scorekeeper.",
  applicationName: "Pickle King",
  alternates: { canonical: "/" },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Pickle King",
  },
  category: "sports",
  icons: {
    apple: "/apple-touch-icon.png",
    icon: "/favicon.ico",
  },
  manifest: "/manifest.webmanifest",
  openGraph: {
    title: "Pickle King — Run the court. Crown the best.",
    description:
      "Offline-first pickleball tournaments, scoring, timing, and results.",
    images: [
      {
        url: "/social/pickle-king-card.png",
        width: 1200,
        height: 630,
        alt: "Pickle King on a neon pickleball court",
      },
    ],
    type: "website",
  },
  robots: { index: true, follow: true },
  twitter: {
    card: "summary_large_image",
    images: ["/social/pickle-king-card.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#090b08",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
