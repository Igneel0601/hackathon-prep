// Auth.js route handler — exposes all /api/auth/* endpoints (signin, callback, session…).
// See docs/apis/auth/route.md.
import { handlers } from "@/auth";

export const { GET, POST } = handlers;
