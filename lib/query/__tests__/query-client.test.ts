import { ApiError } from "@/lib/api/errors";
import { createQueryClient } from "@/lib/query/query-client";

describe("createQueryClient", () => {
  it("applies global query defaults", () => {
    const queryClient = createQueryClient();
    const defaults = queryClient.getDefaultOptions();

    expect(defaults.queries?.refetchOnWindowFocus).toBe(false);
    expect(defaults.queries?.staleTime).toBe(30_000);
    expect(defaults.mutations?.retry).toBe(false);
  });

  it("does not retry 4xx API errors", () => {
    const queryClient = createQueryClient();
    const retry = queryClient.getDefaultOptions().queries?.retry;

    expect(typeof retry).toBe("function");
    if (typeof retry !== "function") {
      throw new Error("retry option should be a function");
    }

    expect(retry(0, new ApiError("bad request", 400, null))).toBe(false);
    expect(retry(0, new Error("network error"))).toBe(true);
    expect(retry(2, new Error("network error"))).toBe(false);
  });
});
