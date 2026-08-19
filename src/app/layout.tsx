import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: {
    default: "QRForge — QR Code Generator",
    template: "%s | QRForge",
  },
  description: "Generate, customize, and track QR codes.",
  openGraph: {
    siteName: "QRForge",
    title: "QRForge — QR Code Generator",
    description: "Generate, customize, and track QR codes.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "QRForge — QR Code Generator",
    description: "Generate, customize, and track QR codes.",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
