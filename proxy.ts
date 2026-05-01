import { type NextRequest, NextResponse } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  const { response, supabase, user } = await updateSession(request);
  const pathname = request.nextUrl.pathname;

  const isLoginRoute = pathname === "/login";
  const isProtectedRoute = pathname.startsWith("/dashboard") || pathname.startsWith("/companies");

  console.log("Middleware session update:", { user, pathname });

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
  matcher: ["/login", "/dashboard/:path*", "/companies/:path*"],
};
