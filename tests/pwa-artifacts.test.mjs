import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

async function text(path) {
  return readFile(new URL(path, root), "utf8");
}

test("production build contains a generated offline service worker", async () => {
  const workerPath = new URL("dist/client/sw.js", root);
  const worker = await readFile(workerPath, "utf8");
  assert.ok((await stat(workerPath)).size > 2_000);
  assert.match(worker, /offline\.html/);
  assert.doesNotMatch(worker, /Build placeholder/);
  assert.match(await text("dist/client/offline.html"), /Still in play/);
});

test("install assets include standard and maskable icons", async () => {
  const required = [
    "public/icons/icon-192.png",
    "public/icons/icon-512.png",
    "public/icons/icon-maskable-192.png",
    "public/icons/icon-maskable-512.png",
    "public/apple-touch-icon.png",
  ];
  for (const path of required) {
    assert.ok((await stat(new URL(path, root))).size > 1_000, path);
  }
  const manifest = await text("app/manifest.ts");
  assert.match(manifest, /purpose: "maskable"/);
  assert.match(manifest, /display: "standalone"/);
});
