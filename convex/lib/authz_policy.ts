import type { Doc } from "../_generated/dataModel";

export type OrgRole = Doc<"orgMembers">["role"];
export type EventRole = Doc<"eventRoles">["role"];

export type Capability =
  | "org:read"
  | "org:manage"
  | "org:transfer"
  | "org:dupr"
  | "event:read"
  | "event:manage"
  | "event:register";

export type MatchRoleGate =
  | "staff-score"
  | "staff-record"
  | "staff-correct"
  | "participant-record-candidate"
  | "participant-sign-candidate";

export const orgCapabilities: Record<OrgRole, readonly Capability[]> = {
  owner: ["org:read", "org:manage", "org:transfer", "org:dupr"],
  admin: ["org:read", "org:manage"],
  director: ["org:read"],
  scorer: ["org:read"],
  member: ["org:read"],
};

export const inheritedEventCapabilities: Record<
  OrgRole,
  readonly Capability[]
> = {
  owner: ["event:read", "event:manage", "event:register"],
  admin: ["event:read", "event:manage"],
  director: ["event:read", "event:manage"],
  scorer: ["event:read"],
  member: ["event:read", "event:register"],
};

export const eventCapabilities: Record<EventRole, readonly Capability[]> = {
  director: ["event:read", "event:manage"],
  scorer: ["event:read"],
  player: ["event:read", "event:register"],
};

export const inheritedMatchGates: Record<OrgRole, readonly MatchRoleGate[]> = {
  owner: [
    "staff-score",
    "staff-record",
    "staff-correct",
    "participant-record-candidate",
    "participant-sign-candidate",
  ],
  admin: ["staff-correct"],
  director: ["staff-score", "staff-record", "staff-correct"],
  scorer: ["staff-score", "staff-record"],
  member: ["participant-record-candidate", "participant-sign-candidate"],
};

export const eventMatchGates: Record<EventRole, readonly MatchRoleGate[]> = {
  director: ["staff-score", "staff-record", "staff-correct"],
  scorer: ["staff-score", "staff-record"],
  player: ["participant-record-candidate", "participant-sign-candidate"],
};
