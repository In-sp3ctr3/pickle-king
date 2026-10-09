const convexCloud = /^[a-z0-9]+(?:-[a-z0-9]+)*\.convex\.cloud$/;
const loopback = new Set(["localhost", "127.0.0.1", "[::1]"]);

export function convexDeploymentUrl(value: string | undefined) {
  if (!value) return null;

  try {
    const url = new URL(value);
    const isCloud = url.protocol === "https:" && convexCloud.test(url.hostname);
    const isLocal =
      (url.protocol === "http:" || url.protocol === "https:") &&
      loopback.has(url.hostname);

    if (
      (!isCloud && !isLocal) ||
      (isCloud && url.port) ||
      url.username ||
      url.password ||
      url.pathname !== "/" ||
      url.search ||
      url.hash
    ) {
      return null;
    }

    return url.origin;
  } catch {
    return null;
  }
}
