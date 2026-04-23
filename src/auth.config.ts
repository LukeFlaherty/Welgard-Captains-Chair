import type { NextAuthConfig } from "next-auth";

// Routes vendors can access
const VENDOR_ALLOWED = ["/inspections", "/inspectors", "/account"];

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    session({ session, token }) {
      if (token) {
        session.user.id = token.id ?? "";
        session.user.role = token.role ?? "vendor";
        session.user.mustChangePassword = token.mustChangePassword ?? false;
        session.user.inspectorId = token.inspectorId ?? null;
        session.user.vendorId = token.vendorId ?? null;
        session.user.companyName = token.companyName ?? null;
      }
      return session;
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const role = auth?.user?.role ?? "vendor";
      const mustChangePassword = auth?.user?.mustChangePassword ?? false;
      const pathname = nextUrl.pathname;
      const isLoginPage = pathname === "/login";
      const isChangePasswordPage = pathname === "/change-password";

      if (isLoginPage) {
        if (isLoggedIn) return Response.redirect(new URL("/", nextUrl));
        return true;
      }

      if (!isLoggedIn) return false;

      // Force password change: gate everything except /change-password itself
      if (mustChangePassword && !isChangePasswordPage) {
        return Response.redirect(new URL("/change-password", nextUrl));
      }

      // Prevent accessing /change-password when not required
      if (isChangePasswordPage && !mustChangePassword) {
        return Response.redirect(new URL("/", nextUrl));
      }

      // Settings: admin only
      if (pathname.startsWith("/settings") && role !== "admin") {
        return Response.redirect(new URL("/inspections", nextUrl));
      }

      // Vendor: only allowed routes + root
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
