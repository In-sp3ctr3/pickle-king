import { AppShell } from "@/src/application/app-shell";

export default function Home() {
  const applicationSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Pickle King",
    applicationCategory: "SportsApplication",
    operatingSystem: "Any",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    description:
      "Offline-first pickleball tournaments, scoring, timing, and results.",
  };
  return (
    <>
      <script
        dangerouslySetInnerHTML={{ __html: JSON.stringify(applicationSchema) }}
        type="application/ld+json"
      />
      <AppShell />
    </>
  );
}
