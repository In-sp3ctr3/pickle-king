import { defineConfig } from "@playwright/test";

export default defineConfig({
  outputDir: "test-results",
  preserveOutput: "always",
  snapshotPathTemplate: "{testDir}/{testFilePath}-snapshots/{arg}{ext}",
  testDir: "tests/playwright",
});
