import { AuthProvider } from "@/components/providers/AuthProvider";
// @ts-expect-error Next.js processes global CSS imports.
import "../globals.css";
import { Geist, Geist_Mono } from "next/font/google";
import { Metadata } from "next";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemedToaster } from "@/components/themed-toaster";
import { Suspense } from "react";
import { AuthLoader } from "./_components/AuthLoader";
import { GuestGuard } from "./_components/GuestGuard";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <main className="flex min-h-dvh items-center justify-center px-4 py-10">
              <div className="w-full max-w-sm">
                <Suspense fallback={<AuthLoader />}>
                  <GuestGuard>{children}</GuestGuard>
                </Suspense>
              </div>
            </main>
          </AuthProvider>
          <ThemedToaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
