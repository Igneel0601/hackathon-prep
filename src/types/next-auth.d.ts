// Augments the Auth.js Session to carry the POS user id + role.
// Set in the `session` callback in src/auth.ts.
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "ADMIN" | "EMPLOYEE";
    } & DefaultSession["user"];
  }
}
