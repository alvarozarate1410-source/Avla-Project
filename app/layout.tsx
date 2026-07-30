import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Montserrat } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PwaServiceWorker } from "@/components/layout/pwa-service-worker";
import { SplashScreen } from "@/components/layout/splash-screen";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Bold, angular geometric sans for the brand wordmark (splash screen) —
// Montserrat stands in for AVLA's exact brand typeface.
const montserrat = Montserrat({
  variable: "--font-brand",
  weight: ["700", "800"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AVLA NEXUS — Commercial Intelligence Workspace",
  description: "Convierte expedientes desordenados en expedientes inteligentes listos para evaluación.",
  icons: {
    icon: "/icons/favicon-32.png",
    apple: "/icons/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "AVLA NEXUS",
  },
};

export const viewport: Viewport = {
  themeColor: "#08090f",
  width: "device-width",
  initialScale: 1,
};

const themeInitScript = `
(function() {
  try {
    var stored = localStorage.getItem('avla-theme');
    var theme = stored === 'light' || stored === 'dark' ? stored : 'dark';
    document.documentElement.setAttribute('data-theme', theme);
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${montserrat.variable} h-full antialiased`}
    >
      <head>
        <Script id="theme-init" strategy="beforeInteractive">
          {themeInitScript}
        </Script>
      </head>
      <body className="min-h-full flex flex-col bg-[var(--background)] text-[var(--foreground)]">
        <PwaServiceWorker />
        <SplashScreen />
        <TooltipProvider delayDuration={150}>{children}</TooltipProvider>
      </body>
    </html>
  );
}
