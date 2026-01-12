import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import InteractiveCursor from "@/components/InteractiveCursor";
import { ToastProvider } from "@/components/ui/Toast";
import { EntriesProvider } from "@/context/EntriesContext";
import { ActivityProvider } from "@/context/ActivityContext";
import GlobalCaptureOverlay from "@/components/GlobalCaptureOverlay";
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
  title: "Antinote",
  description: "AI-powered note taking app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${geistSans.variable} ${geistMono.variable}`}>
          <ToastProvider>
            <EntriesProvider>
              <ActivityProvider>
                {/* <InteractiveCursor /> */}
                <GlobalCaptureOverlay />
                {children}
              </ActivityProvider>
            </EntriesProvider>
          </ToastProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
