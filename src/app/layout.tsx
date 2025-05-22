import "./globals.css";
import { Toaster } from "sonner";
import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import ConvexProvider from "@/providers/ConvexProvider";
import { ThemeProvider } from "@/components/theme-provider";

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
      <ConvexProvider>
        <html lang="en" suppressHydrationWarning>
          <body className="font-sans antialiased">
            <ThemeProvider
              attribute="class"
              defaultTheme="light"
              enableSystem
              disableTransitionOnChange
            >
              {children}
              <Toaster position="bottom-right" richColors />
            </ThemeProvider>
          </body>
        </html>
      </ConvexProvider>
    </ClerkProvider>
  );
}
