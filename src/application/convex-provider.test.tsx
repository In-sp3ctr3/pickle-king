// @vitest-environment jsdom

import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Component, type ReactNode } from "react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

let queryResult: unknown = "ready";
let queryError: Error | null = null;
let connectionRetries = 0;

const close = vi.fn();
const construct = vi.fn();
const stored = new Map<string, string>();
const localStorage = {
  clear: () => stored.clear(),
  getItem: (key: string) => stored.get(key) ?? null,
  key: (index: number) => [...stored.keys()][index] ?? null,
  get length() {
    return stored.size;
  },
  removeItem: (key: string) => stored.delete(key),
  setItem: (key: string, value: string) => stored.set(key, value),
};

vi.mock("convex/react", () => ({
  ConvexProvider: ({ children }: { children: ReactNode }) => children,
  ConvexReactClient: class {
    constructor() {
      construct();
    }
    close = close;
  },
  useConvexConnectionState: () => ({
    connectionRetries,
    isWebSocketConnected: connectionRetries === 0,
  }),
  useQuery: () => {
    if (queryError) throw queryError;
    return queryResult;
  },
}));

vi.mock("@number-flow/react", () => ({
  default: ({ value }: { value: number }) => (
    <span aria-label={String(value)}>{value}</span>
  ),
}));

import { ConvexClientProvider } from "./convex-provider";
import { AppShell } from "./app-shell";
import { SNAPSHOT_KEY } from "../persistence/storage";

beforeEach(() => {
  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: localStorage,
  });
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: () => ({
      addEventListener: vi.fn(),
      addListener: vi.fn(),
      dispatchEvent: vi.fn(),
      matches: false,
      media: "",
      onchange: null,
      removeEventListener: vi.fn(),
      removeListener: vi.fn(),
    }),
  });
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function closeDialog() {
    this.removeAttribute("open");
  };
  HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
  HTMLMediaElement.prototype.pause = vi.fn();
  window.scrollTo = vi.fn();
});

class GuestState extends Component<object, { score: number }> {
  state = { score: Number(window.localStorage.getItem("score") ?? 0) };

  render() {
    return (
      <button
        onClick={() =>
          this.setState(({ score }) => {
            window.localStorage.setItem("score", String(score + 1));
            return { score: score + 1 };
          })
        }
        type="button"
      >
        Score {this.state.score}
      </button>
    );
  }
}

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  queryResult = "ready";
  queryError = null;
  connectionRetries = 0;
  close.mockClear();
  construct.mockClear();
});

test("keeps guest mode usable without backend configuration", () => {
  render(
    <ConvexClientProvider url={undefined}>
      <GuestState />
    </ConvexClientProvider>,
  );

  fireEvent.click(screen.getByRole("button", { name: "Score 0" }));
  expect(screen.getByRole("button", { name: "Score 1" })).toBeTruthy();
  expect(window.localStorage.getItem("score")).toBe("1");
  expect(screen.getByRole("status").textContent).toContain("Cloud unavailable");
});

test("renders the deterministic query result when connected", async () => {
  render(
    <ConvexClientProvider url="https://happy-animal-123.convex.cloud">
      <GuestState />
    </ConvexClientProvider>,
  );

  await waitFor(() =>
    expect(screen.getByRole("status").textContent).toContain("Cloud ready"),
  );
});

test("does not construct a Convex client during server rendering", () => {
  expect(
    renderToString(
      <ConvexClientProvider url="https://happy-animal-123.convex.cloud">
        <GuestState />
      </ConvexClientProvider>,
    ),
  ).toContain("connecting");
  expect(construct).not.toHaveBeenCalled();
});

async function proveRealGuestFlow(status: string) {
  const user = userEvent.setup();
  const first = render(
    <ConvexClientProvider url="https://happy-animal-123.convex.cloud">
      <AppShell />
    </ConvexClientProvider>,
  );

  await screen.findByRole("button", { name: /quick match/i });
  await waitFor(() =>
    expect(
      (
        screen.getByRole("button", {
          name: /quick match/i,
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(false),
  );
  await user.click(screen.getByRole("button", { name: /quick match/i }));
  fireEvent.change(await screen.findByLabelText("Side A"), {
    target: { value: "Ada" },
  });
  fireEvent.change(screen.getByLabelText("Side B"), {
    target: { value: "Grace" },
  });
  await user.click(screen.getByRole("button", { name: /open scorer/i }));
  await user.click(screen.getByRole("button", { name: "Start match" }));
  await user.click(screen.getAllByRole("button", { name: /start match/i })[1]);
  await user.click(
    screen.getByRole("button", { name: "Record Ada as the rally winner" }),
  );

  expect(screen.getByLabelText("Ada, 1 points")).toBeTruthy();
  expect(document.querySelector(".backend-status")?.textContent).toContain(
    status,
  );
  await waitFor(() =>
    expect(window.localStorage.getItem(SNAPSHOT_KEY)).toBeTruthy(),
  );

  first.unmount();
  render(
    <ConvexClientProvider url="https://happy-animal-123.convex.cloud">
      <AppShell />
    </ConvexClientProvider>,
  );

  expect(await screen.findByLabelText("Ada, 1 points")).toBeTruthy();
  expect(document.querySelector(".backend-status")?.textContent).toContain(
    status,
  );
}

test("keeps real guest flow usable when the backend is unreachable", async () => {
  queryResult = undefined;
  connectionRetries = 2;
  await proveRealGuestFlow("Cloud offline");
});

test("keeps real guest flow usable when the query throws", async () => {
  queryError = new Error("backend failed");
  const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
  try {
    await proveRealGuestFlow("Cloud unavailable");
  } finally {
    consoleError.mockRestore();
  }
});

test("closes the client on unmount", async () => {
  const view = render(
    <ConvexClientProvider url="https://happy-animal-123.convex.cloud">
      <GuestState />
    </ConvexClientProvider>,
  );

  await screen.findByText("Cloud ready");
  act(() => view.unmount());
  expect(close).toHaveBeenCalledOnce();
});
