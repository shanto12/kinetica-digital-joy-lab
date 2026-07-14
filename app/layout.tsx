import type { Metadata, Viewport } from "next";
import { DM_Sans, IBM_Plex_Mono, Syne } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";

const display = Syne({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

const body = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const mono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["500", "600"],
});

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const metadataBase = new URL(`${protocol}://${host}`);

  return {
    metadataBase,
    title: "KINETICA — Digital Joy Lab",
    description:
      "A technicolor playground for restless cursors, curious fingers, and anyone who thinks the web should feel alive.",
    applicationName: "KINETICA",
    alternates: { canonical: "/" },
    openGraph: {
      type: "website",
      title: "KINETICA — Good things happen in motion",
      description: "Drag, tap, remix, and play inside a colorful digital joy lab.",
      images: [{ url: "/og.png", width: 1200, height: 630, alt: "KINETICA — Good things happen in motion" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "KINETICA — Good things happen in motion",
      description: "A colorful digital joy lab built to move.",
      images: ["/og.png"],
    },
    robots: { index: true, follow: true },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#fff8e7",
  colorScheme: "light",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${display.variable} ${body.variable} ${mono.variable}`}>
        {children}
      </body>
    </html>
  );
}
