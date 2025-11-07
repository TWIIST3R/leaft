import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

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
    <html lang="fr">
      <body className={`${inter.variable} antialiased bg-[var(--bg)] text-[var(--text)]`}>
        <div className="flex min-h-screen flex-col">
          <SiteHeader />
          <div className="grow">{children}</div>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
