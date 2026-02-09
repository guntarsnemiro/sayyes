import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import PWARegistration from "./PWARegistration";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://sayyesapp.com"),
  title: "SayYes — A weekly connection for couples who choose to stay together",
  description: "SayYes is a calm, weekly relationship check-in for couples who want to stay together. Not therapy. No pressure. Just clarity and connection.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SayYes",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: "SayYes — A weekly connection for couples who choose to stay together",
    description: "SayYes is a calm, weekly relationship check-in for couples who want to stay together. Not therapy. No pressure. Just clarity and connection.",
    url: "https://sayyesapp.com/",
    siteName: "SayYes",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SayYes — A weekly connection for couples who choose to stay together",
    description: "SayYes is a calm, weekly relationship check-in for couples who want to stay together. Not therapy. No pressure. Just clarity and connection.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <PWARegistration />
        {children}
      </body>
    </html>
  );
}
