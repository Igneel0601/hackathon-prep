// Auth.js (NextAuth v5) config. Import { auth, signIn, signOut } from "@/auth".
// Uses Prisma adapter -> database sessions (pairs with OAuth providers, not Credentials).
import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import GitHub from "next-auth/providers/github";
import { db } from "@/lib/db";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(db),
  session: { strategy: "database" },
  // Placeholder provider. Reads AUTH_GITHUB_ID / AUTH_GITHUB_SECRET from env.
  // Swap/add providers (Google, etc.) once the idea is picked.
  providers: [GitHub],
});
