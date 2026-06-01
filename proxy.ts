import { type NextRequest, NextResponse } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

function redirectWithSessionCookies(url: URL, sessionResponse: NextResponse) {
  const redirectResponse = NextResponse.redirect(url);

  sessionResponse.cookies.getAll().forEach((cookie) => {
    const { name, value, ...options } = cookie;
    redirectResponse.cookies.set(name, value, options);
  });
  redirectResponse.headers.set("Cache-Control", "private, no-store");

  return redirectResponse;
}

export async function proxy(request: NextRequest) {
  const { response, supabase, claims } = await updateSession(request);
  const pathname = request.nextUrl.pathname;
  const userId = claims?.sub;

  const isLoginRoute = pathname === "/login";
  const protectedPrefixes = [
    "/dashboard",
    "/companies",
    "/users",
    "/suppliers",
    "/purchase-orders",
    "/billing",
  ];
  const isProtectedRoute = protectedPrefixes.some((prefix) => pathname.startsWith(prefix));

  if (!userId && isProtectedRoute) {
    return redirectWithSessionCookies(new URL("/login", request.url), response);
  }

  if (userId && isLoginRoute) {
    const { data: userRecord } = await supabase
      .from("users")
      .select("is_super_admin")
      .eq("id", userId)
      .maybeSingle();

    const destination = userRecord?.is_super_admin ? "/companies" : "/dashboard";
    return redirectWithSessionCookies(new URL(destination, request.url), response);
  }

  return response;
}

export const config = {
  matcher: [
    "/login",
    "/dashboard/:path*",
    "/companies/:path*",
    "/users/:path*",
    "/suppliers/:path*",
    "/purchase-orders/:path*",
    "/billing/:path*",
  ],
};
