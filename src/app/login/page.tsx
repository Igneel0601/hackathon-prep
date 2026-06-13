import { Suspense } from "react";
import { LoginForm } from "./login-form";

// Server wrapper — LoginForm uses useSearchParams, which needs a Suspense boundary.
export default function LoginPage() {
  return (
    <main
      className="flex min-h-screen items-center justify-center p-5"
      style={{
        backgroundImage:
          "radial-gradient(ellipse 80% 70% at 50% 38%, rgba(13,5,2,0.80) 0%, rgba(13,5,2,0.94) 100%), url('/coffee-beans.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <Suspense>
        <LoginForm />
      </Suspense>
    </main>
  );
}
