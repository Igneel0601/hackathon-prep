"use client";

import { useState } from "react";
import { Save, X } from "lucide-react";
import { Container, PageHeader } from "@/components/layout";
import {
  Card,
  CardHeader,
  CardTitle,
  CardBody,
  CardFooter,
  Input,
  Textarea,
  Select,
  Button,
  Badge,
  Avatar,
  Modal,
  useToast,
} from "@/components/ui";
import { detail } from "@/lib/content";

export default function DetailDemo() {
  const { toast } = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [emailError, setEmailError] = useState<string>();

  return (
    <Container className="py-8 sm:py-12">
      <PageHeader
        title={detail.title}
        subtitle={detail.subtitle}
        actions={
          <>
            <Button variant="ghost" leadingIcon={<X />} onClick={() => setConfirmOpen(true)}>
              Cancel
            </Button>
            <Button
              leadingIcon={<Save />}
              onClick={() => toast({ intent: "success", title: "Changes saved", description: "Customer profile updated." })}
            >
              Save changes
            </Button>
          </>
        }
      />

      <form
        className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3"
        onSubmit={(e) => {
          e.preventDefault();
          toast({ intent: "success", title: "Changes saved" });
        }}
      >
        {/* Form — left / main */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
            </CardHeader>
            <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input label="First name" defaultValue="Mara" required />
              <Input label="Last name" defaultValue="Holloway" required />
              <Input
                label="Email"
                type="email"
                defaultValue="mara@northwind.io"
                required
                error={emailError}
                onBlur={(e) =>
                  setEmailError(e.target.value.includes("@") ? undefined : "Enter a valid email address.")
                }
                className="sm:col-span-2"
              />
              <Select label="Plan" options={detail.planOptions} defaultValue="enterprise" />
              <Select label="Region" options={detail.regionOptions} defaultValue="us" />
              <Textarea
                label="Notes"
                placeholder="Internal notes about this customer…"
                helper="Only visible to your team."
                className="sm:col-span-2"
              />
            </CardBody>
          </Card>
        </div>

        {/* Summary — right / aside */}
        <aside className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardBody className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <Avatar name="Mara Holloway" size="lg" />
                <div className="flex flex-col">
                  <span className="font-medium text-fg">Mara Holloway</span>
                  <span className="text-sm text-fg-dim">Customer since 2023</span>
                </div>
              </div>
              <dl className="flex flex-col gap-3 text-sm">
                <div className="flex items-center justify-between">
                  <dt className="text-fg-muted">Plan</dt>
                  <dd><Badge tone="accent">Enterprise</Badge></dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-fg-muted">Status</dt>
                  <dd><Badge tone="success" dot>Active</Badge></dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-fg-muted">MRR</dt>
                  <dd className="font-medium text-fg">$1,200</dd>
                </div>
              </dl>
            </CardBody>
            <CardFooter className="sm:justify-end">
              <Button type="submit" leadingIcon={<Save />} className="w-full sm:w-auto">
                Save changes
              </Button>
            </CardFooter>
          </Card>
        </aside>
      </form>

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Discard changes?"
        description="Any unsaved edits to this customer will be lost."
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmOpen(false)}>
              Keep editing
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                setConfirmOpen(false);
                toast({ intent: "warn", title: "Changes discarded" });
              }}
            >
              Discard
            </Button>
          </>
        }
      >
        This action cannot be undone.
      </Modal>
    </Container>
  );
}
