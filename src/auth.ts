// Auth.js (NextAuth v5) config. Import { auth, signIn, signOut } from "@/auth".
//
// Sessions: JWT strategy (required because the Credentials provider can't use
// database sessions). Auth state lives in a signed cookie, not the Session table.
// Providers:
//   1. Credentials — email/password (primary). Checks bcrypt against User.passwordHash.
//   2. Google — OAuth (secondary). Works once AUTH_GOOGLE_ID/SECRET are set; the app
//      runs fine without them, the Google button just won't authenticate.
import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      name: "Email & Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(creds) {
        const email = typeof creds?.email === "string" ? creds.email.toLowerCase() : "";
        const password = typeof creds?.password === "string" ? creds.password : "";
        if (!email || !password) return null;

        const user = await db.user.findUnique({ where: { email } });
        if (!user?.passwordHash) return null;
        if (!user.active) return null; // archived accounts can't log in

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;

        return { id: user.id, name: user.name, email: user.email, role: user.role };
      },
    }),
    Google, // secondary — reads AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET
  ],
  callbacks: {
    // Carry id + role on the JWT, then expose them on the session.
    // Typed in src/types/next-auth.d.ts.
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = (user as { role?: "ADMIN" | "EMPLOYEE" }).role ?? "EMPLOYEE";
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) ?? session.user.id;
        session.user.role = (token.role as "ADMIN" | "EMPLOYEE") ?? "EMPLOYEE";
      }
      return session;
    },
  },
});
