import "./globals.css";
import { Toaster } from "sonner";
import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import ErrorBoundary from "@/components/ErrorBoundary";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  title: "TrustInk | First Smart Agreements Platform",
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
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <ErrorBoundary>{children}</ErrorBoundary>
            <Toaster position="bottom-right" richColors />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
