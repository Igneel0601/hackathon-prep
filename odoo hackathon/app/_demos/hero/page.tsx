"use client";

import { ArrowRight, BookOpen, Sparkles } from "lucide-react";
import { Container } from "@/components/layout";
import { Button, Badge, Card, CardBody } from "@/components/ui";
import { useGsap } from "@/lib/useGsap";
import { hero } from "@/lib/content";

export default function HeroDemo() {
  const ref = useGsap(({ self, gsap, q }) => {
    gsap.set(q("[data-reveal]"), { autoAlpha: 0, y: 24 });
    gsap.set(q("[data-visual]"), { autoAlpha: 0, y: 32, scale: 0.98 });
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
    tl.to(q("[data-reveal]"), { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.08 });
    tl.to(q("[data-visual]"), { autoAlpha: 1, y: 0, scale: 1, duration: 0.7 }, "-=0.4");
    // void self — context is scoped to it
    void self;
  }, []);

  return (
    <Container className="py-12 sm:py-20">
      <div
        ref={ref}
        className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16"
      >
        <div className="flex flex-col items-start gap-5">
          <Badge tone="accent" dot data-reveal>
            {hero.eyebrow}
          </Badge>
          <h1
            data-reveal
            className="text-4xl font-semibold leading-[1.05] tracking-tight text-fg text-balance sm:text-5xl lg:text-6xl"
          >
            {hero.title}
          </h1>
          <p data-reveal className="max-w-md text-base text-fg-muted text-pretty sm:text-lg">
            {hero.subtitle}
          </p>
          <div data-reveal className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Button size="lg" trailingIcon={<ArrowRight />}>
              {hero.primaryCta}
            </Button>
            <Button size="lg" variant="secondary" leadingIcon={<BookOpen />}>
              {hero.secondaryCta}
            </Button>
          </div>
          <dl data-reveal className="mt-4 flex flex-wrap gap-x-8 gap-y-4">
            {hero.stats.map((s) => (
              <div key={s.label} className="flex flex-col">
                <dt className="text-xs uppercase tracking-wide text-fg-dim">{s.label}</dt>
                <dd className="text-lg font-semibold text-fg">{s.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Visual block */}
        <Card data-visual className="overflow-hidden">
          <div className="flex items-center gap-2 border-b border-border px-4 py-3">
            <span className="size-3 rounded-pill bg-bg-3" />
            <span className="size-3 rounded-pill bg-bg-3" />
            <span className="size-3 rounded-pill bg-bg-3" />
          </div>
          <CardBody className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-md bg-bg-3 text-accent">
                <Sparkles className="size-5" />
              </span>
              <div className="flex flex-1 flex-col gap-1">
                <div className="h-3 w-2/3 rounded-pill bg-bg-3" />
                <div className="h-3 w-1/3 rounded-pill bg-bg-3" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex flex-col gap-2 rounded-md border border-border bg-bg p-3">
                  <div className="h-2 w-1/2 rounded-pill bg-bg-3" />
                  <div className="h-5 w-3/4 rounded-pill bg-bg-3" />
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-2">
              <div className="h-3 w-full rounded-pill bg-bg-3" />
              <div className="h-3 w-5/6 rounded-pill bg-bg-3" />
              <div className="h-3 w-3/4 rounded-pill bg-bg-3" />
            </div>
          </CardBody>
        </Card>
      </div>
    </Container>
  );
}
