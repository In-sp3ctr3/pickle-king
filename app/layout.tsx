import type { Metadata, Viewport } from "next";
import "@fontsource/anton/latin-400.css";
import "@fontsource/alfa-slab-one/latin-400.css";
import "@fontsource/archivo-black/latin-400.css";
import "@fontsource/manrope/latin-400.css";
import "@fontsource/manrope/latin-700.css";
import "@fontsource/manrope/latin-800.css";
import "@fontsource/roboto-condensed/latin-700.css";
import "@fontsource/roboto-condensed/latin-900.css";
import "@fontsource/roboto-slab/latin-900.css";
import "./globals.css";
import { siteUrl } from "./site-url";

export const metadata: Metadata = {
  metadataBase: siteUrl ? new URL(siteUrl) : undefined,
  title: {
    default: "Pickle King | Run the court. Crown the best.",
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
    title: "Pickle King | Run the court. Crown the best.",
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
      <body>
        {children}
        <span
          aria-hidden="true"
          data-share-font-preload=""
          style={{
            height: 1,
            left: 0,
            opacity: 0,
            overflow: "hidden",
            pointerEvents: "none",
            position: "fixed",
            top: 0,
            width: 1,
          }}
        >
          <span style={{ fontFamily: "Anton", fontWeight: 400 }}>
            PICKLE KING
          </span>
          <span style={{ fontFamily: "Roboto Condensed", fontWeight: 900 }}>
            PLAYER W–L
          </span>
          <span style={{ fontFamily: "Roboto Condensed", fontWeight: 700 }}>
            PLAYER W–L
          </span>
          <span style={{ fontFamily: "Roboto Slab", fontWeight: 900 }}>
            11–7
          </span>
          <span style={{ fontFamily: "Alfa Slab One", fontWeight: 400 }}>
            11–7
          </span>
          <span style={{ fontFamily: "Manrope", fontWeight: 800 }}>AUG 22</span>
        </span>
      </body>
    </html>
  );
}
