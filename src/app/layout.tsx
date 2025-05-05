import "./globals.css";
import { Toaster } from "sonner";
import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "@/components/theme-provider";
import { DemoModeProvider } from "@/contexts/DemoModeContext";
import ErrorBoundary from '@/components/ErrorBoundary';

export const metadata: Metadata = {
  title: {
    default: "TrustInk | First Smart Agreements Platform",
    template: "%s | TrustInk",
  },
  description: "First Smart Agreements Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className="font-sans antialiased">
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            <DemoModeProvider>
              <ErrorBoundary>{children}</ErrorBoundary>
              <Toaster position="bottom-right" richColors />
            </DemoModeProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
