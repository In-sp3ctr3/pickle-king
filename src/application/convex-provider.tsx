"use client";

import { Component, useEffect, useState, type ReactNode } from "react";
import {
  ConvexProvider,
  ConvexReactClient,
  useConvexConnectionState,
  useQuery,
} from "convex/react";
import { api } from "../../convex/_generated/api";
import { convexDeploymentUrl } from "../backend/convex-url";

type CloudState = "connecting" | "offline" | "ready" | "unavailable";

function CloudStatus({ state }: { state: CloudState }) {
  const local = state === "ready" ? "" : " · local scoring stays available";
  return (
    <output
      aria-atomic="true"
      aria-live="polite"
      className="backend-status"
      role="status"
    >
      Cloud {state}
      {local}
    </output>
  );
}

class DiagnosticBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed ? (
      <CloudStatus state="unavailable" />
    ) : (
      this.props.children
    );
  }
}

function BackendStatus() {
  const result = useQuery(api.status.health);
  const connection = useConvexConnectionState();
  const label =
    connection.connectionRetries > 0 && !connection.isWebSocketConnected
      ? "offline"
      : result === "ready"
        ? "ready"
        : "connecting";

  return <CloudStatus state={label} />;
}

export function ConvexClientProvider({
  children,
  url = process.env.NEXT_PUBLIC_CONVEX_URL,
}: {
  children: ReactNode;
  url?: string;
}) {
  const deploymentUrl = convexDeploymentUrl(url);
  const [client, setClient] = useState<ConvexReactClient | null>(null);

  useEffect(() => {
    if (!deploymentUrl) return;
    const next = new ConvexReactClient(deploymentUrl, { logger: false });
    let active = true;
    queueMicrotask(() => {
      if (active) setClient(next);
    });
    return () => {
      active = false;
      void next.close();
    };
  }, [deploymentUrl]);

  if (!deploymentUrl) {
    return (
      <>
        <CloudStatus state="unavailable" />
        {children}
      </>
    );
  }

  return (
    <>
      {client ? (
        <ConvexProvider client={client}>
          <DiagnosticBoundary>
            <BackendStatus />
          </DiagnosticBoundary>
        </ConvexProvider>
      ) : (
        <CloudStatus state="connecting" />
      )}
      {children}
    </>
  );
}
