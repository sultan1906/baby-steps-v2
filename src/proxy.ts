import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

// Routes that don't require authentication
const PUBLIC_ROUTES = [
  "/",
  "/auth",
  "/auth/verify-email",
  "/auth/reset-password",
  "/forgot-password",
  "/terms",
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

  // Pass the current pathname to server components via header
  const response = NextResponse.next();
  response.headers.set("x-pathname", pathname);
  return response;
}

export const config = {
  matcher: [
    // Skip Next.js internals, static files, and images
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp)$).*)",
  ],
};
