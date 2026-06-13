// Auth.js (NextAuth v5) config. Import { auth, signIn, signOut } from "@/auth".
// Uses Prisma adapter -> database sessions (pairs with OAuth providers, not Credentials).
import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Google from "next-auth/providers/google";
import { db } from "@/lib/db";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(db),
  session: { strategy: "database" },
  // Reads AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET from env.
  providers: [Google],
  callbacks: {
    // Expose the DB user's id + role on the session (db-session strategy passes `user`).
    // Typed in src/types/next-auth.d.ts.
    session({ session, user }) {
      session.user.id = user.id;
      session.user.role = (user as { role?: "ADMIN" | "EMPLOYEE" }).role ?? "EMPLOYEE";
      return session;
    },
  },
});
