import { auth } from "@/auth";
import { NextResponse } from "next/server";
import type { NextAuthRequest } from "next-auth";

export default auth((req: NextAuthRequest) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  if (!isLoggedIn && nextUrl.pathname !== "/admin/login") {
    return NextResponse.redirect(new URL("/admin/login", nextUrl));
  }
  return NextResponse.next();
});

export const config = {
  matcher: ["/admin", "/admin/events/:path*", "/admin/licenses"],
};
