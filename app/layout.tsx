import type { Metadata } from "next";
import { DM_Sans, Manrope } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
});

const manrope = Manrope({
  variable: "--font-display",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "SomaMais — A rotina escolar, simples de verdade",
    template: "%s · SomaMais",
  },
  description:
    "Rotina, comunicação e gestão para escolas de educação infantil. Menos tempo preenchendo, mais tempo cuidando e ensinando.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SomaMais",
  },
};

export const viewport = {
  themeColor: "#0759bd",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${dmSans.variable} ${manrope.variable}`}>
      <body>{children}<SpeedInsights /></body>
    </html>
  );
}
