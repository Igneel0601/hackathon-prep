import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FloorPickerModal } from "./FloorPickerModal";
import type { Floor } from "@/lib/api-types";

const floors: Floor[] = [
  {
    id: "f1",
    name: "Ground",
    tables: [
      { id: "t1", number: 1, seats: 4, active: true, hasActiveOrder: false },
      { id: "t2", number: 2, seats: 2, active: true, hasActiveOrder: true },
    ],
  },
];

describe("FloorPickerModal", () => {
  it("renders the floor name and its tables", () => {
    render(
      <FloorPickerModal floors={floors} onSelectTable={() => {}} onClose={() => {}} />,
    );
    expect(screen.getByText("Ground")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("selecting a free table then confirming calls onSelectTable with that table", async () => {
    const onSelectTable = vi.fn();
    render(
      <FloorPickerModal floors={floors} onSelectTable={onSelectTable} onClose={() => {}} />,
    );
    // Free tables are a two-step select→confirm: clicking the table highlights
    // it and reveals the "Open Table" CTA, which fires onSelectTable.
    await userEvent.click(screen.getByText("1"));
    expect(onSelectTable).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole("button", { name: /Open Table/i }));
    expect(onSelectTable).toHaveBeenCalledWith(expect.objectContaining({ id: "t1" }));
  });

  it("an occupied table can also be selected (resume its order)", async () => {
    const onSelectTable = vi.fn();
    render(
      <FloorPickerModal floors={floors} onSelectTable={onSelectTable} onClose={() => {}} />,
    );
    await userEvent.click(screen.getByText("2"));
    expect(onSelectTable).toHaveBeenCalledWith(expect.objectContaining({ id: "t2" }));
  });

  it("the close button calls onClose", async () => {
    const onClose = vi.fn();
    render(
      <FloorPickerModal floors={floors} onSelectTable={() => {}} onClose={onClose} />,
    );
    await userEvent.click(screen.getByLabelText("Close"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("shows an empty state when there are no floors", () => {
    render(<FloorPickerModal floors={[]} onSelectTable={() => {}} onClose={() => {}} />);
    expect(screen.getByText("No floors found.")).toBeInTheDocument();
  });
});
