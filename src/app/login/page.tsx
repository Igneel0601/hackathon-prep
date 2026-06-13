import { Suspense } from "react";
import { LoginForm } from "./login-form";

// Server wrapper — LoginForm uses useSearchParams, which needs a Suspense boundary.
export default function LoginPage() {
  return (
    <main className="flex min-h-full flex-1 items-center justify-center p-4">
      <Suspense>
        <LoginForm />
      </Suspense>
    </main>
  );
}
