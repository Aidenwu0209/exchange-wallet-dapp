import { describe, expect, it } from "vitest";
import { addAtomic, gtAtomic, ratioDecimal, subAtomic } from "../src/utils/amount.js";

describe("amount utilities", () => {
  it("uses bigint-safe atomic math", () => {
    expect(addAtomic("1000000000000000000", "2")).toBe("1000000000000000002");
    expect(subAtomic("1000000000000000002", "2")).toBe("1000000000000000000");
    expect(gtAtomic("11", "10")).toBe(true);
  });

  it("formats reserve ratio without floats", () => {
    expect(ratioDecimal("150", "100")).toBe("1.5");
    expect(ratioDecimal("1", "3")).toBe("0.333333");
  });
});
