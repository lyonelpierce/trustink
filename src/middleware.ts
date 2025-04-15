import { NextResponse } from "next/server";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// This example protects all routes including api/trpc routes
// Please edit this to allow other routes to be public as needed.
// See https://clerk.com/docs/references/nextjs/auth-middleware for more information about configuring your Middleware
const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in",
  "/sign-up",
  "/sign(.*)",
  "/api/webhooks/clerk",
]);

export default clerkMiddleware(async (auth, req) => {
  const url = req.nextUrl;

  // If it's the Clerk webhook endpoint, let it pass through
  if (url.pathname.startsWith("/api/webhooks/clerk"))
    return NextResponse.next();

  // If it's an API route (except clerk webhook which is handled above), let it pass through
  if (url.pathname.startsWith("/api/")) return NextResponse.next();

  // Get hostname of request (e.g. demo.vercel.pub, demo.localhost:3123)
  // biome-ignore lint/style/noNonNullAssertion: <explanation>
  let hostname = req.headers
    .get("host")!
    .replace(".localhost:3000", `.${process.env.NEXT_PUBLIC_BASE_URL}`);

  // special case for Vercel preview deployment URLs
  if (
    hostname.includes("---") &&
    hostname.endsWith(`.${process.env.NEXT_PUBLIC_VERCEL_DEPLOYMENT_SUFFIX}`)
  ) {
    hostname = `${hostname.split("---")[0]}.${
      process.env.NEXT_PUBLIC_BASE_URL
    }`;
  }

  const searchParams = req.nextUrl.searchParams.toString();
  // Get the pathname of the request (e.g. /, /about, /blog/first-post)
  const path = `${url.pathname}${
    searchParams.length > 0 ? `?${searchParams}` : ""
  }`;

  // rewrites for app pages
  if (hostname === `app.${process.env.NEXT_PUBLIC_BASE_URL}`) {
    const { userId } = await auth();
    if (!userId && !isPublicRoute(req)) {
      const prefix =
        process.env.NODE_ENV === "development" ? "http://" : "https://";

      const { redirectToSignIn } = await auth();
      return redirectToSignIn({ returnBackUrl: `${prefix}${hostname}/` });
    }

    return NextResponse.rewrite(
      new URL(`/app${path === "/" ? "" : path}`, req.url)
    );
  }

  // rewrite root application to `/` folder
  if (
    hostname === "localhost:3000" ||
    hostname === process.env.NEXT_PUBLIC_BASE_URL ||
    hostname === "www." + process.env.NEXT_PUBLIC_BASE_URL ||
    hostname === "trustink.ai" || // Add explicit domain
    hostname === "www.trustink.ai" // Add www subdomain
  ) {
    return NextResponse.rewrite(new URL(path, req.url));
  }
  // console.log("here");

  // rewrite everything else to `/[domain]/[slug] dynamic route
  return NextResponse.rewrite(new URL(`/${hostname}${path}`, req.url));
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
