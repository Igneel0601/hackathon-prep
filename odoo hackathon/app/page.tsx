import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/layout";
import { Card, CardBody, Badge } from "@/components/ui";
import { brand, demos } from "@/lib/content";

export default function Home() {
  return (
    <Container className="py-12 sm:py-20">
      <div className="flex flex-col gap-2">
        <Badge tone="accent" className="w-fit">
          {brand.tagline}
        </Badge>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-fg text-balance sm:text-4xl">
          {brand.name}
        </h1>
        <p className="max-w-xl text-fg-muted text-pretty">
          A neutral, responsive component kit. Every surface is driven by the CSS variables in{" "}
          <code className="rounded bg-bg-3 px-1.5 py-0.5 text-sm text-fg">app/globals.css</code>.
          Explore the demos below.
        </p>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {demos.map((d) => (
          <Link key={d.href} href={d.href} className="group">
            <Card interactive className="h-full">
              <CardBody className="flex items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <span className="text-base font-semibold text-fg">{d.label}</span>
                  <span className="text-sm text-fg-muted">{d.description}</span>
                </div>
                <ArrowRight className="size-5 shrink-0 text-fg-dim transition-transform duration-200 group-hover:translate-x-1 group-hover:text-fg" />
              </CardBody>
            </Card>
          </Link>
        ))}
      </div>
    </Container>
  );
}
