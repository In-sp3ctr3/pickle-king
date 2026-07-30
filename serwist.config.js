/** @type {import("@serwist/cli").BuildOptions} */
const config = {
  esbuildOptions: { format: "iife" },
  globDirectory: "dist/client",
  globIgnores: ["**/*.map", "sw.js"],
  globPatterns: ["**/*.{css,html,ico,js,json,png,svg,webp,woff,woff2,xml}"],
  injectionPoint: "self.__SW_MANIFEST",
  maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
  swDest: "dist/client/sw.js",
  swSrc: "src/sw.ts",
};

export default config;
