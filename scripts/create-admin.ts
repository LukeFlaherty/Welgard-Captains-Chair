/**
 * One-time script to create an admin user.
 * Usage: npx tsx scripts/create-admin.ts
 *
 * Set these env vars (or pass via .env.local):
 *   ADMIN_EMAIL=you@example.com
 *   ADMIN_PASSWORD=yourpassword
 *   ADMIN_NAME="Your Name"
 */

import { config } from "dotenv";
config({ path: ".env.local" });
config();

import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const email = process.env.ADMIN_EMAIL ?? "admin@welgard.com";
const password = process.env.ADMIN_PASSWORD ?? "changeme123";
const name = process.env.ADMIN_NAME ?? "Admin";

async function main() {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`User ${email} already exists — skipping creation.`);
    process.exit(0);
  }

  const hashed = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { email, name, password: hashed, role: "admin" },
  });

  console.log(`\nAdmin user created:`);
  console.log(`  ID:    ${user.id}`);
  console.log(`  Name:  ${user.name}`);
  console.log(`  Email: ${user.email}`);
  console.log(`\nChange the password after first login.\n`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
