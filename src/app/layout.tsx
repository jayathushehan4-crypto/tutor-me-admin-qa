// src/app/layout.tsx

import { Outfit } from "next/font/google";
import type { Metadata } from "next";
import "./globals.css";

import ProtectedRoute from "@/components/ProtectedRoute";
import { SentryErrorBoundary } from "@/components/SentryErrorBoundary";
import { AuthProvider } from "@/context/auth-context";
import { SidebarProvider } from "@/context/SidebarContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { WithProviders } from "@/hocs/with-providers";

const outfit = Outfit({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Admin | Tuition Lanka",
  icons: {
    icon: "/images/logo/LightThemeLogoIcon.svg",
    shortcut: "/images/logo/LightThemeLogoIcon.svg",
    apple: "/images/logo/LightThemeLogoIcon.svg",
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
        className={`${outfit.className} dark:bg-gray-900`}
        suppressHydrationWarning
      >
        <SentryErrorBoundary>
          <WithProviders>
            <AuthProvider>
              <ProtectedRoute>
                <ThemeProvider>
                  <SidebarProvider>{children}</SidebarProvider>
                </ThemeProvider>
              </ProtectedRoute>
            </AuthProvider>
          </WithProviders>
        </SentryErrorBoundary>
      </body>
    </html>
  );
}
