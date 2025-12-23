import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { koKR } from "@clerk/localizations";
import "./globals.css";

export const metadata: Metadata = {
  title: "BATHLANCE (배슬랜스)",
  description: "소중한 내 욕실용품 교체 알리미",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "배슬랜스",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: "/icons/icon-192x192.svg",
    apple: "/icons/icon-192x192.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#e1621c",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  if (!publishableKey) {
    throw new Error("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is missing");
  }

  return (
    <ClerkProvider publishableKey={publishableKey} localization={koKR}>
      <html lang="ko">
        <head>
          <link rel="apple-touch-icon" href="/icons/icon-192x192.svg" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta
            name="apple-mobile-web-app-status-bar-style"
            content="default"
          />
          <meta name="apple-mobile-web-app-title" content="배슬랜스" />
          <meta name="mobile-web-app-capable" content="yes" />
        </head>
        <body className="font-gaegu">{children}</body>
      </html>
    </ClerkProvider>
  );
}
