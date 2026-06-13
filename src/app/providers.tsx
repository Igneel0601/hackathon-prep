// Client providers wrapped around the whole app. Lets components use
// useSession() from next-auth/react.
"use client";

import { SessionProvider } from "next-auth/react";

export function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
