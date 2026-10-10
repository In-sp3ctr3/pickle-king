import { describe, expect, test } from "vitest";
import { convexDeploymentUrl } from "./convex-url";

describe("convexDeploymentUrl", () => {
  test.each([
    [
      "https://happy-animal-123.convex.cloud",
      "https://happy-animal-123.convex.cloud",
    ],
    [
      "https://happy-animal-123.convex.cloud/",
      "https://happy-animal-123.convex.cloud",
    ],
    ["http://127.0.0.1:3210", "http://127.0.0.1:3210"],
    ["http://localhost:3210", "http://localhost:3210"],
    ["http://[::1]:3210", "http://[::1]:3210"],
  ])("accepts supported deployment URL %s", (input, expected) => {
    expect(convexDeploymentUrl(input)).toBe(expected);
  });

  test.each([
    undefined,
    "",
    "not a url",
    "http://happy-animal-123.convex.cloud",
    "https://happy-animal-123.convex.cloud:3210",
    "https://example.com",
    "https://user:secret@happy-animal-123.convex.cloud",
    "https://happy-animal-123.convex.cloud/path",
    "https://happy-animal-123.convex.cloud?token=secret",
    "https://happy-animal-123.convex.cloud#fragment",
  ])("rejects unsupported deployment URL %s", (input) => {
    expect(convexDeploymentUrl(input)).toBeNull();
  });
});
