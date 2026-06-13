import { Suspense } from "react";
import Image from "next/image";
import { LoginForm } from "./login-form";
import { CAFE_IMAGERY } from "@/lib/product-image";

// Server wrapper — LoginForm uses useSearchParams, which needs a Suspense boundary.
export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-1">
      {/* Left — ambience hero (hidden on small screens) */}
      <div className="relative hidden w-1/2 lg:block">
        <Image
          src={CAFE_IMAGERY.interior}
          alt="A warm, inviting café interior"
          fill
          priority
          sizes="50vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-espresso/85 via-espresso/35 to-transparent" />
        <div className="absolute inset-0 flex flex-col justify-end p-12 text-cream">
          <div className="flex items-center gap-2 text-sm font-medium uppercase tracking-[0.25em] text-cream/80">
            <span className="text-lg">☕</span> Odoo Cafe
          </div>
          <h1 className="font-heading mt-3 text-5xl font-bold leading-tight drop-shadow-sm">
            Brewed with care,
            <br /> served with speed.
          </h1>
          <p className="mt-4 max-w-md text-cream/85">
            The point-of-sale that keeps your counter calm and your kitchen in sync.
          </p>
        </div>
      </div>

      {/* Right — auth form */}
      <div className="flex w-full flex-col items-center justify-center bg-background p-6 lg:w-1/2">
        <div className="mb-8 flex items-center gap-2 lg:hidden">
          <span className="text-2xl">☕</span>
          <span className="font-heading text-2xl font-bold text-espresso">Odoo Cafe</span>
        </div>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
