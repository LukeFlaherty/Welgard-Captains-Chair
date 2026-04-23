import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { authConfig } from "./auth.config";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await db.user.findUnique({
          where: { email: parsed.data.email },
          select: { id: true, email: true, name: true, password: true, role: true },
        });
        if (!user) return null;

        const passwordMatch = await bcrypt.compare(parsed.data.password, user.password);
        if (!passwordMatch) return null;

        return { id: user.id, email: user.email ?? "", name: user.name, role: user.role };
      },
    }),
  ],
  callbacks: {
    // authorized + session come from authConfig (Edge-safe, also used in middleware)
    authorized: authConfig.callbacks.authorized,
    session: authConfig.callbacks.session,
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role ?? "vendor";
      }
      return token;
    },
  },
});
