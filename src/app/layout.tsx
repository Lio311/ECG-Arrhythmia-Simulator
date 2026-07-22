import type { Metadata } from "next";
import { Heebo, Assistant, Geist } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const heebo = Heebo({ subsets: ["hebrew"], variable: "--font-heebo" });
const assistant = Assistant({ subsets: ["hebrew"], variable: "--font-assistant" });

export const metadata: Metadata = {
  title: "סימולטור ECG | ECG Arrhythmia Simulator",
  description: "סימולציה אינטראקטיבית של הפרעות קצב לב שונות",
  openGraph: {
    title: "סימולטור ECG | ECG Arrhythmia Simulator",
    description: "סימולציה אינטראקטיבית של הפרעות קצב לב שונות",
    type: "website",
    locale: "he_IL",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // AEO JSON-LD Schema
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "סימולטור ECG",
    "description": "סימולציה אינטראקטיבית של הפרעות קצב לב שונות",
    "applicationCategory": "EducationalApplication",
    "operatingSystem": "Any",
    "offers": {
      "@type": "Offer",
      "price": "0"
    }
  };

  return (
    <html lang="he" dir="rtl" className={cn("dark", "font-sans", geist.variable)}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${heebo.className} ${assistant.variable} antialiased dark`}>
        {children}
      </body>
    </html>
  );
}
