import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session-token";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? verifySessionToken(token) : null;

  if (!session) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/insights/:path*",
    "/copilot/:path*",
    "/transactions/:path*",
    "/invoices/:path*",
    "/banking/:path*",
    "/budgets/:path*",
    "/reports/:path*",
    "/chart-of-accounts/:path*",
    "/documents/:path*",
    "/contacts/:path*",
    "/settings/:path*",
    "/api/:path*",
  ],
};
