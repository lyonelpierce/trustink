import { NextResponse } from "next/server";
import { clerkMiddleware } from "@clerk/nextjs/server";

// Define the main domain and protected routes
const rootDomain = "trustink.dev";
const protectedPaths = ["/dashboard", "/profile", "/editor", "/app"];

export default clerkMiddleware(async (auth, req) => {
  const url = req.nextUrl;
  const hostname = req.headers.get("host") || "";
  const isLocalhost = hostname.includes("localhost");

  let subdomain = "";
  if (isLocalhost) {
    // Handle localhost subdomains
    const parts = hostname.split(".localhost");
    // Only set subdomain if there's actually a subdomain
    if (parts.length > 1) {
      subdomain = parts[0];
    }
  } else if (hostname.endsWith(`.${rootDomain}`)) {
    subdomain = hostname.replace(`.${rootDomain}`, "").toLowerCase();
  }

  // Check if the current path is protected
  const isProtectedPath = protectedPaths.some((path) =>
    url.pathname.startsWith(path)
  );

  // Handle authentication for protected routes
  if (isProtectedPath) {
    await auth.protect();
  }

  // Handle subdomain routing
  if (subdomain && subdomain !== "www") {
    // Protect subdomain access
    await auth.protect();
    // Rewrite subdomain requests to /apps/{subdomain}
    const newUrl = new URL(`/app/`, req.url);
    return NextResponse.rewrite(newUrl);
  }

  // Handle main domain routing
  if (!subdomain || subdomain === "www" || hostname === rootDomain) {
    return NextResponse.next();
  }
});

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
    "/api/:path*",
    "/trpc/:path*",
  ],
};
