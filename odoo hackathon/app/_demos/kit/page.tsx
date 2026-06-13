"use client";

import { useState } from "react";
import {
  Plus,
  ArrowRight,
  Download,
  Trash2,
  Inbox,
  Settings,
  Pencil,
  Copy,
  Search,
  Info,
} from "lucide-react";
import { Container } from "@/components/layout";
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardBody,
  CardFooter,
  Badge,
  Input,
  Textarea,
  Select,
  Field,
  Modal,
  Tabs,
  useToast,
  Spinner,
  Skeleton,
  Avatar,
  EmptyState,
  Tooltip,
  Dropdown,
} from "@/components/ui";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4 border-t border-border py-10 first:border-0 first:pt-0">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-fg-dim">{title}</h2>
      {children}
    </section>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap items-center gap-3">{children}</div>;
}

export default function KitDemo() {
  const { toast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [tab, setTab] = useState("overview");

  return (
    <Container className="py-10 sm:py-14">
      <header className="flex flex-col gap-2">
        <Badge tone="accent" className="w-fit">Living style guide</Badge>
        <h1 className="text-3xl font-semibold tracking-tight text-fg">Component kit</h1>
        <p className="max-w-xl text-fg-muted text-pretty">
          Every primitive, variant and state. All of it reskins from the CSS variables in{" "}
          <code className="rounded bg-bg-3 px-1.5 py-0.5 text-sm text-fg">globals.css</code>.
        </p>
      </header>

      <div className="mt-8">
        {/* Buttons */}
        <Section title="Button — variants">
          <Row>
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger">Danger</Button>
          </Row>
          <Row>
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
          </Row>
          <Row>
            <Button leadingIcon={<Plus />}>Leading icon</Button>
            <Button trailingIcon={<ArrowRight />} variant="secondary">Trailing icon</Button>
            <Button loading>Loading</Button>
            <Button disabled>Disabled</Button>
            <Button variant="danger" leadingIcon={<Trash2 />}>Delete</Button>
          </Row>
        </Section>

        {/* Badges */}
        <Section title="Badge / Pill">
          <Row>
            <Badge tone="neutral">Neutral</Badge>
            <Badge tone="accent">Accent</Badge>
            <Badge tone="success" dot>Success</Badge>
            <Badge tone="warn" dot>Warning</Badge>
            <Badge tone="danger" dot>Danger</Badge>
          </Row>
        </Section>

        {/* Card */}
        <Section title="Card">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Static card</CardTitle>
              </CardHeader>
              <CardBody className="text-sm text-fg-muted">
                Header, body and footer slots. Built from token utilities only.
              </CardBody>
              <CardFooter className="sm:justify-end">
                <Button variant="ghost" size="sm">Cancel</Button>
                <Button size="sm">Confirm</Button>
              </CardFooter>
            </Card>
            <Card interactive>
              <CardBody className="flex h-full items-center text-sm text-fg-muted">
                Interactive card — hover to see the lift.
              </CardBody>
            </Card>
          </div>
        </Section>

        {/* Forms */}
        <Section title="Inputs & fields">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Default" placeholder="you@example.com" />
            <Input label="With helper" placeholder="username" helper="3–20 characters." />
            <Input label="Error" defaultValue="nope" error="This field is required." />
            <Input label="Disabled" placeholder="Unavailable" disabled />
            <Select
              label="Select"
              placeholder="Choose a plan"
              options={[
                { value: "free", label: "Free" },
                { value: "pro", label: "Pro" },
                { value: "ent", label: "Enterprise" },
              ]}
            />
            <Field id="search-field" label="Custom control (Field)" helper="Field wraps any control.">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-fg-dim" />
                <Input id="search-field" placeholder="Search…" className="pl-9" />
              </div>
            </Field>
            <Textarea label="Textarea" placeholder="Write something…" className="sm:col-span-2" />
          </div>
        </Section>

        {/* Tabs */}
        <Section title="Tabs">
          <Tabs
            value={tab}
            onValueChange={setTab}
            tabs={[
              { value: "overview", label: "Overview" },
              { value: "activity", label: "Activity" },
              { value: "settings", label: "Settings", icon: <Settings /> },
              { value: "disabled", label: "Disabled", disabled: true },
            ]}
          />
          <p className="text-sm text-fg-muted">
            Active tab: <span className="font-medium text-fg">{tab}</span>. Use ← → / Home / End to navigate.
          </p>
        </Section>

        {/* Overlays */}
        <Section title="Overlays — Modal, Tooltip, Dropdown, Toast">
          <Row>
            <Button onClick={() => setModalOpen(true)}>Open modal</Button>
            <Tooltip content="I appear on hover and focus">
              <Button variant="secondary" leadingIcon={<Info />}>Hover me</Button>
            </Tooltip>
            <Dropdown
              trigger={<Button variant="secondary" trailingIcon={<ArrowRight />}>Menu</Button>}
              items={[
                { label: "Edit", icon: Pencil, onSelect: () => toast({ title: "Edit" }) },
                { label: "Duplicate", icon: Copy, onSelect: () => toast({ title: "Duplicated" }) },
                { label: "Delete", icon: Trash2, danger: true, onSelect: () => toast({ intent: "danger", title: "Deleted" }) },
              ]}
            />
          </Row>
          <Row>
            <Button variant="secondary" size="sm" onClick={() => toast({ intent: "info", title: "Heads up", description: "An informational toast." })}>Info toast</Button>
            <Button variant="secondary" size="sm" onClick={() => toast({ intent: "success", title: "Saved", description: "Your changes are live." })}>Success toast</Button>
            <Button variant="secondary" size="sm" onClick={() => toast({ intent: "warn", title: "Careful", description: "Your trial ends soon." })}>Warn toast</Button>
            <Button variant="secondary" size="sm" onClick={() => toast({ intent: "danger", title: "Something broke", description: "Please retry." })}>Danger toast</Button>
          </Row>
        </Section>

        {/* Loading */}
        <Section title="Loading — Spinner & Skeleton">
          <Row>
            <Spinner />
            <Spinner className="size-6 text-accent" />
            <Button loading variant="secondary">Working</Button>
          </Row>
          <Card className="max-w-sm">
            <CardBody className="flex items-center gap-3">
              <Skeleton className="size-10 rounded-pill" />
              <div className="flex flex-1 flex-col gap-2">
                <Skeleton className="h-3 w-2/3" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </CardBody>
          </Card>
        </Section>

        {/* Avatar */}
        <Section title="Avatar">
          <Row>
            <Avatar name="Mara Holloway" size="sm" />
            <Avatar name="Devin Ortiz" size="md" />
            <Avatar name="Priya Raman" size="lg" />
            <Avatar src="/broken.png" name="Fallback Works" size="lg" />
          </Row>
        </Section>

        {/* EmptyState */}
        <Section title="EmptyState">
          <EmptyState
            icon={Inbox}
            title="No reports yet"
            description="Create your first report to see analytics across your workspace."
            action={<Button leadingIcon={<Plus />}>New report</Button>}
          />
        </Section>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Example modal"
        description="Centered on desktop, a bottom sheet on mobile."
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button leadingIcon={<Download />} onClick={() => setModalOpen(false)}>Export</Button>
          </>
        }
      >
        Focus is trapped while open, Esc closes, and the overlay click dismisses. Enter and exit are
        orchestrated with GSAP; hover and focus states are CSS transitions.
      </Modal>
    </Container>
  );
}
