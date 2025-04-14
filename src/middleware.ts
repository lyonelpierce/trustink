import { NextResponse } from "next/server";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

export const config = {
  matcher: [
    /*
     * Match all paths except for:
     * 1. /api routes
     * 2. /_next (Next.js internals)
     * 3. /_static (inside /public)
     * 4. all root files inside /public (e.g. /favicon.ico)
     */
    "/((?!_next/|_static/|_vercel|[\\w-]+\\.\\w+).*)",
  ],
};

const reservedSubdomains = [
  "clkmail",
  "clk2._domainkey",
  "clk._domainkey",
  "accounts",
  "clerk",
  "purelymail3._domainkey",
  "purelymail2._domainkey",
  "purelymail1._domainkey",
  "_dmarc",
];

const isDashboardRoute = createRouteMatcher(["/dashboard(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  try {
    if (isDashboardRoute(req)) await auth.protect();

    const url = req.nextUrl;
    const host = req.headers.get("host") || "";

    // Normalize hostname - Remove port and protocol
    const hostname = host.split(":")[0].replace(/^https?:\/\//, "");
    const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || "").replace(
      /^https?:\/\//,
      ""
    );

    // Handle root domain and www subdomain
    if (
      hostname === "localhost" ||
      hostname === baseUrl ||
      hostname === `www.${baseUrl}` ||
      hostname === "trustink.ai" ||
      hostname === "www.trustink.ai"
    ) {
      return NextResponse.next();
    }

    // Construct path with search params
    const searchParams = url.searchParams.toString();
    const path = `${url.pathname}${searchParams ? `?${searchParams}` : ""}`;

    // Handle app subdomain
    if (hostname.startsWith("app.")) {
      // Check if it's an API route
      if (url.pathname.startsWith("/api/")) {
        return NextResponse.next();
      }
      return NextResponse.rewrite(new URL(`/app${path}`, req.url));
    }

    // Handle reserved subdomains
    if (
      reservedSubdomains.some(
        (subdomain) =>
          hostname === `${subdomain}.${process.env.NEXT_PUBLIC_BASE_URL}`
      )
    ) {
      return NextResponse.redirect(url);
    }

    // Handle all other routes
    return NextResponse.rewrite(new URL(`/${hostname}${path}`, req.url));
  } catch (error) {
    console.error("[Middleware Error]", error);
    return NextResponse.next();
  }
});
