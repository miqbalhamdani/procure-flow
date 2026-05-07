import { type NextRequest, NextResponse } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  const { response, supabase, user } = await updateSession(request);
  const pathname = request.nextUrl.pathname;

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

  if (!user && isProtectedRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (user && isLoginRoute) {
    const { data: userRecord } = await supabase
      .from("users")
      .select("is_super_admin")
      .eq("id", user.id)
      .maybeSingle();

    const destination = userRecord?.is_super_admin ? "/companies" : "/dashboard";
    return NextResponse.redirect(new URL(destination, request.url));
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
