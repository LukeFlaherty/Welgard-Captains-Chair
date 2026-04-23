import type { NextAuthConfig } from "next-auth";

// Routes vendors (inspectors) can access
const VENDOR_ALLOWED = ["/inspections"];

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    session({ session, token }) {
      if (token) {
        session.user.id = token.id ?? "";
        session.user.role = token.role ?? "vendor";
      }
      return session;
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const role = auth?.user?.role ?? "vendor";
      const pathname = nextUrl.pathname;
      const isLoginPage = pathname === "/login";

      if (isLoginPage) {
        if (isLoggedIn) return Response.redirect(new URL("/", nextUrl));
        return true;
      }

      if (!isLoggedIn) return false;

      // Settings: admin only
      if (pathname.startsWith("/settings") && role !== "admin") {
        return Response.redirect(new URL("/inspections", nextUrl));
      }

      // Vendor: only inspection routes + root (which redirects to /inspections)
      if (role === "vendor") {
        const allowed =
          pathname === "/" ||
          VENDOR_ALLOWED.some((p) => pathname.startsWith(p));
        if (!allowed) {
          return Response.redirect(new URL("/inspections", nextUrl));
        }
      }

      return true;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
