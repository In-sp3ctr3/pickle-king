import { defineConfig } from "@playwright/test";

export default defineConfig({
  outputDir: "test-results",
  preserveOutput: "always",
  testDir: "tests/playwright",
});
