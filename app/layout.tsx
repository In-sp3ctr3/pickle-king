import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://pickle-king.openai-sites.com"),
  title: {
    default: "Pickle King — Run the court. Crown the best.",
    template: "%s · Pickle King",
  },
  description:
    "A private, offline-first pickleball tournament director and scorekeeper.",
  applicationName: "Pickle King",
  category: "sports",
  robots: { index: true, follow: true },
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
