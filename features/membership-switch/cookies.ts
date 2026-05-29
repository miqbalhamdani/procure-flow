import type { cookies } from "next/headers";

import { ACTIVE_MEMBERSHIP_COOKIE } from "./constants";

type CookieStore = Awaited<ReturnType<typeof cookies>>;

export function setActiveMembershipCookie(cookieStore: CookieStore, membershipId: string) {
  cookieStore.set(ACTIVE_MEMBERSHIP_COOKIE, membershipId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
}

