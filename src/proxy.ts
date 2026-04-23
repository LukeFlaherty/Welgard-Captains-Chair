import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import type { NextRequest } from "next/server";

const { auth } = NextAuth(authConfig);

// Next.js 16 requires an explicit named "proxy" function export.
// auth() from Auth.js is a callable but multi-signature — wrapping it satisfies the build check.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function proxy(request: NextRequest, event: any) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (auth as any)(request, event);
}

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
