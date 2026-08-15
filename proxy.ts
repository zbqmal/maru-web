import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME } from "@/lib/auth/session";

export const config = {
  matcher: [
    "/calendar/:path*",
    "/diary/:path*",
    "/home/:path*",
    "/profile/:path*",
    "/questions/:path*",
  ],
};

export const proxy = (request: NextRequest) => {
  if (request.cookies.has(AUTH_COOKIE_NAME)) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", request.nextUrl.pathname + request.nextUrl.search);
  return NextResponse.redirect(loginUrl);
};
