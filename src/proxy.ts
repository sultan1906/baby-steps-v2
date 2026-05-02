import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";
import { INVITE_COOKIE_NAME, INVITE_COOKIE_MAX_AGE_SECONDS } from "@/lib/invite-cookie";

// Routes that don't require authentication
const PUBLIC_ROUTES = [
  "/",
  "/auth",
  "/auth/verify-email",
  "/auth/reset-password",
  "/forgot-password",
  "/terms",
  "/invite",
];

export async function proxy(request: NextRequest) {
  const session = await getSessionCookie(request);
  const { pathname } = request.nextUrl;

  const isPublic =
    PUBLIC_ROUTES.some((r) => pathname === r || pathname.startsWith(r + "/")) ||
    pathname.startsWith("/api/auth");

  // No session → redirect to /auth (unless already on a public route)
  if (!session && !isPublic) {
    return NextResponse.redirect(new URL("/auth", request.url));
  }

  // Has session → redirect away from auth page
  if (session && pathname === "/auth") {
    return NextResponse.redirect(new URL("/timeline", request.url));
  }

  const response = NextResponse.next();

  // Pass the current pathname to server components via header
  response.headers.set("x-pathname", pathname);

  // On /invite/<token> for unauthenticated viewers, stash the token in a
  // cookie so we can redeem it after they sign up / sign in. Setting cookies
  // from middleware is the reliable place for this in Next.js 15+.
  if (!session) {
    const inviteMatch = pathname.match(/^\/invite\/([^/]+)$/);
    if (inviteMatch) {
      response.cookies.set(INVITE_COOKIE_NAME, inviteMatch[1], {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: INVITE_COOKIE_MAX_AGE_SECONDS,
      });
    }
  }

  return response;
}

export const config = {
  matcher: [
    // Skip Next.js internals, static files, and images
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp)$).*)",
  ],
};
