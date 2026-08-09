import type { Metadata } from "next";
import "./globals.css";

const siteUrl = process.env.SITE_URL ?? "http://localhost:3000";
const description =
  "Typed movement observations and multi-source evidence for human emergency review.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Pōneke movement watch",
  description,
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
  openGraph: {
    title: "Pōneke movement watch",
    description,
    url: siteUrl,
    images: [{ url: "/og-ontology-v2.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pōneke movement watch",
    description,
    images: ["/og-ontology-v2.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-NZ">
      <body>
        <a className="skip-link" href="#main-content">Skip to main content</a>
        {children}
      </body>
    </html>
  );
}
