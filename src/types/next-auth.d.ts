// Augments Auth.js to carry the POS user id + role through the JWT and session.
// Set in the callbacks in src/auth.ts.
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "ADMIN" | "EMPLOYEE";
    } & DefaultSession["user"];
  }

  interface User {
    role?: "ADMIN" | "EMPLOYEE";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: "ADMIN" | "EMPLOYEE";
  }
}
