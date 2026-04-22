import { PrismaClient } from "@/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

function createClient(): PrismaClient {
  if (!process.env.DATABASE_URL) {
    // During build without a DB, return a deferred proxy.
    // At runtime, DATABASE_URL must be set.
    if (process.env.NODE_ENV === "production" || process.env.NEXT_PHASE === "phase-production-build") {
      // Return a no-op proxy so the build succeeds; runtime will have the real URL.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return new Proxy({} as PrismaClient, {
        get(_, prop) {
          if (prop === "$connect" || prop === "$disconnect") return () => Promise.resolve();
          throw new Error(
            `[db] DATABASE_URL is not configured. Set it in your .env.local file or Vercel environment variables.`
          );
        },
      });
    }
    throw new Error("[db] DATABASE_URL is required. Add it to .env.local.");
  }

  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  return new PrismaClient({ adapter });
}

export const db: PrismaClient = globalThis.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalThis.prisma = db;
