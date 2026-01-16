import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { frFR } from "@clerk/localizations";
import "./globals.css";
import { clientEnv } from "@/env";
import { ConditionalLayoutClient } from "./conditional-layout-client";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Leaft – Transparence salariale et parcours collaborateurs",
  description:
    "Leaft aide les équipes People à structurer les grilles salariales, suivre les évolutions et offrir un espace employé complet.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      publishableKey={clientEnv.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
      localization={frFR}
    >
      <html lang="fr">
        <body className={`${inter.variable} antialiased bg-[var(--bg)] text-[var(--text)]`}>
          <ConditionalLayout>{children}</ConditionalLayout>
        </body>
      </html>
    </ClerkProvider>
  );
}

function ConditionalLayout({ children }: { children: React.ReactNode }) {
  return <ConditionalLayoutClient>{children}</ConditionalLayoutClient>;
}
