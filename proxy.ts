import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  // Get the pathname
  const pathname = request.nextUrl.pathname;

  // Define public routes (accessible without authentication)
  const publicRoutes = [
    "/",
    "/about",
    "/anti-fraud",
    "/joining-process",
    "/login",
    "/sign-in",
    "/register",
    "/forgot-password",
    "/reset-password",
  ];

  // Define protected routes (require authentication)
  const protectedRoutes = ["/dashboard", "/deposit", "/withdraw"];

  // Get the session token from cookies
  const sessionToken = request.cookies.get("next-auth.session-token")?.value || 
                       request.cookies.get("__Secure-next-auth.session-token")?.value;

  // If user is authenticated (has session token)
  if (sessionToken) {
    // Redirect from login/auth pages to dashboard
    if (
      pathname === "/login" ||
      pathname === "/sign-in" ||
      pathname === "/register"
    ) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  // If user is not authenticated
  if (!sessionToken) {
    // Redirect from protected routes to home
    if (protectedRoutes.some((route) => pathname.startsWith(route))) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|public|api/auth|.well-known).*)",
  ],
};
