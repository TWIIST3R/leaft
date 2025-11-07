import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

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
        {children}
      </body>
    </html>
  );
}
