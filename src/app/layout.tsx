import "./globals.css";
import { Toaster } from "sonner";
import type { Metadata } from "next";
import { ConvexReactClient } from "convex/react";
import ErrorBoundary from "@/components/ErrorBoundary";
import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { ThemeProvider } from "@/components/theme-provider";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { DemoModeProvider } from "@/contexts/DemoModeContext";

export const metadata: Metadata = {
  title: {
    default: "TrustInk | First Smart Agreements Platform",
    template: "%s | TrustInk",
  },
  description: "First Smart Agreements Platform",
};

const convex = new ConvexReactClient(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY as string
);

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
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
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}
