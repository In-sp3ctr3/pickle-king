export type ExpectedOutcome = {
  url?: string;
  visible?: string;
  text?: { selector: string; value: string };
};

export type Control = {
  name: string;
  selector: string;
  viewports?: string[];
  sequence?: string;
  action: "click" | "fill" | "press" | "check" | "select";
  auditOnly?: boolean;
  value?: string;
  expect: ExpectedOutcome;
};

export type MotionCheck = {
  name: string;
  selector: string;
  stateAttribute: string;
  requiredStates: string[];
  reducedMotionState: string;
  observationMs: number;
  triggerSequence?: string;
};

export type CanvasCheck = {
  name: string;
  canvasSelector: string;
  semanticSelector: string;
  fallbackSelector: string;
  renderStateAttribute: string;
  activeValue: string;
  pausedValue: string;
  reducedValue: string;
  fallbackValue: string;
  dprAttribute: string;
  maxDpr: number;
};

export type Route = {
  name: string;
  path: string;
  prepare?:
    | "tournament-setup"
    | "four-player-bracket"
    | "four-player-completed-bracket"
    | "four-player-completed-home"
    | "four-player-history"
    | "four-player-history-results"
    | "four-player-results"
    | "round-robin-initial"
    | "round-robin-qualified"
    | "round-robin-completed"
    | "round-robin-results"
    | "round-robin-history-results"
    | "round-robin-five-initial"
    | "round-robin-six-timed-setup"
    | "round-robin-six-untimed-setup"
    | "round-robin-six-results"
    | "round-robin-six-history-results"
    | "quick-setup"
    | "quick-idle"
    | "quick-live"
    | "quick-result"
    | "quick-history"
    | "history-empty";
  primaryActionSelector?: string;
  primaryActionNotApplicableReason?: string;
  visualEvidence: Record<
    string,
    { source: string; render: string; comparison: string }
  >;
  controls: Control[];
  motionChecks?: MotionCheck[];
  reducedMotionChecks?: Array<{
    name: string;
    selector: string;
    expect: "visible" | "hidden";
  }>;
  canvasChecks?: CanvasCheck[];
};

export type RouteMap = {
  baseUrl?: string;
  viewports: Array<{ name: string; width: number; height: number }>;
  routes: Route[];
};
