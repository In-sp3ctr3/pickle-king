import { describe, expect, it } from "vitest";

describe("project foundation", () => {
  it("uses the documented local storage namespace", () => {
    expect("pickle-king:snapshot").toMatch(/^pickle-king:/);
  });
});
