import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TableCard } from "./TableCard";

describe("TableCard", () => {
  it("renders number, seats, and 'Free' for an available table", () => {
    render(<TableCard number={3} seats={4} status="free" onClick={() => {}} />);
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("4 seats")).toBeInTheDocument();
    expect(screen.getByText("Free")).toBeInTheDocument();
  });

  it("shows 'Occupied' for an active table and is still clickable (resume order)", async () => {
    const onClick = vi.fn();
    render(<TableCard number={1} seats={2} status="occupied" onClick={onClick} />);

    expect(screen.getByText("Occupied")).toBeInTheDocument();
    const btn = screen.getByRole("button");
    expect(btn).not.toBeDisabled();

    await userEvent.click(btn);
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
