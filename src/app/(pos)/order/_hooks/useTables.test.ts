import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useTables } from "./useTables";
import * as client from "@/lib/api-client";

vi.mock("@/lib/api-client");

describe("useTables", () => {
  beforeEach(() => vi.resetAllMocks());

  it("starts loading, then resolves with floors", async () => {
    vi.mocked(client.getTables).mockResolvedValue({
      floors: [{ id: "f1", name: "Ground", tables: [] }],
    });

    const { result } = renderHook(() => useTables());
    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.floors).toHaveLength(1);
    expect(result.current.error).toBeNull();
  });

  it("captures an error message on failure", async () => {
    vi.mocked(client.getTables).mockRejectedValue(new Error("boom"));

    const { result } = renderHook(() => useTables());

    await waitFor(() => expect(result.current.error).toBe("boom"));
    expect(result.current.loading).toBe(false);
  });
});
