import type { Metadata } from "next";
import { IBM_Plex_Mono, Space_Grotesk } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { ServiceWorkerRegistration } from "@/components/service-worker-registration";
import { getRuntimeTheme, getRuntimeThemeStyle } from "@/services/runtime-theme";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: {
    default: "myMEDLIFE",
    template: "%s | myMEDLIFE",
  },
  description: "Mobile-first MEDLIFE chapter operating system for Rush Month.",
  applicationName: "myMEDLIFE",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "myMEDLIFE",
  },
  icons: {
    icon: [{ url: "/icons/my-medlife-icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icons/my-medlife-icon.svg", type: "image/svg+xml" }],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const runtimeTheme = await getRuntimeTheme();

  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${ibmPlexMono.variable} h-full antialiased`}
      data-theme-source={runtimeTheme.source}
      style={getRuntimeThemeStyle(runtimeTheme)}
    >
      <body className="min-h-full flex flex-col">
        <ServiceWorkerRegistration />
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
