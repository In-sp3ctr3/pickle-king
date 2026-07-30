"use client";

import { useMemo, useRef } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ActionButton } from "@/src/shared/ui";
import type { TournamentBracket } from "@/src/tournament";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  createTreeLayout,
  type BracketLink,
  type PositionedNode,
} from "./bracket-tree-layout";
import { roundLabel } from "./bracket-utils";
import {
  ByeOutcomeCard,
  ChampionCard,
  EntryCard,
  FinalistCard,
  OutcomeCard,
} from "./tree-node-cards";

interface BracketTreeProps {
  bracket: TournamentBracket;
  nextMatchId?: string;
  onCorrectMatch: (matchId: string) => void;
  onStartMatch: (matchId: string) => void;
}

export function BracketTree({
  bracket,
  nextMatchId,
  onCorrectMatch,
  onStartMatch,
}: BracketTreeProps) {
  const layout = useMemo(() => createTreeLayout(bracket), [bracket]);
  const viewportRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const positionedById = new Map(
    layout.nodes.map((positioned) => [positioned.node.id, positioned]),
  );

  function moveViewport(direction: -1 | 1) {
    viewportRef.current?.scrollBy({
      behavior: reducedMotion ? "auto" : "smooth",
      left: direction * Math.max(280, viewportRef.current.clientWidth * 0.72),
    });
  }

  return (
    <div className="bracket-tree-shell">
      <div className="bracket-tree-toolbar">
        <p>
          <span>
            <span aria-hidden="true">←</span> Opening pairings
          </span>
          <span className="bracket-tree-toolbar__final">Champion</span>
          <span>
            Opening pairings <span aria-hidden="true">→</span>
          </span>
        </p>
        <div aria-label="Move across the bracket">
          <ActionButton
            aria-label="Move bracket view left"
            data-qa="bracket-left"
            onClick={() => moveViewport(-1)}
            variant="secondary"
          >
            <ChevronLeft aria-hidden="true" size={18} />
            Left
          </ActionButton>
          <ActionButton
            aria-label="Move bracket view right"
            data-qa="bracket-right"
            onClick={() => moveViewport(1)}
            variant="secondary"
          >
            Right
            <ChevronRight aria-hidden="true" size={18} />
          </ActionButton>
        </div>
      </div>

      <div
        aria-label="Connected tournament bracket. Opening pairings converge on two finalists and one champion."
        className="bracket-tree-viewport"
        ref={viewportRef}
        role="region"
        tabIndex={0}
      >
        <div
          className="bracket-tree-board"
          role="list"
          style={{ height: layout.boardHeight, width: layout.boardWidth }}
        >
          {layout.links.map((link) => (
            <TreeConnector
              from={positionedById.get(link.fromId)}
              key={`${link.fromId}-${link.toId}`}
              link={link}
              to={positionedById.get(link.toId)}
            />
          ))}
          {layout.nodes.map((positioned) => (
            <motion.div
              animate={{ opacity: 1, scale: 1 }}
              className={`bracket-tree-node bracket-tree-node--${positioned.node.kind}`}
              initial={
                reducedMotion ? false : { opacity: 1, scale: 0.97, y: 4 }
              }
              key={positioned.node.id}
              role="listitem"
              style={{
                height: positioned.height,
                left: positioned.x,
                top: positioned.y - positioned.height / 2,
                width: positioned.width,
              }}
              transition={{ duration: reducedMotion ? 0 : 0.32 }}
            >
              <TreeNode
                bracket={bracket}
                canStart={
                  positioned.node.kind === "match"
                    ? positioned.node.match.id === nextMatchId
                    : positioned.node.kind === "champion"
                      ? positioned.node.match.id === nextMatchId
                      : false
                }
                node={positioned.node}
                onCorrectMatch={onCorrectMatch}
                onStartMatch={onStartMatch}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TreeNode({
  bracket,
  canStart,
  node,
  onCorrectMatch,
  onStartMatch,
}: {
  bracket: TournamentBracket;
  canStart: boolean;
  node: PositionedNode["node"];
  onCorrectMatch: (matchId: string) => void;
  onStartMatch: (matchId: string) => void;
}) {
  if (node.kind === "entry") {
    return <EntryCard player={node.player} slot={node.slot} />;
  }
  if (node.kind === "bye") {
    return (
      <ByeOutcomeCard
        label={`Round 1 · ${node.ordinal}`}
        playerName={node.player.name}
      />
    );
  }
  if (node.kind === "champion") {
    return (
      <ChampionCard
        canStart={canStart}
        match={node.match}
        onCorrectMatch={onCorrectMatch}
        onStartMatch={onStartMatch}
        players={bracket.players}
      />
    );
  }
  if (node.kind === "finalist") {
    return (
      <FinalistCard
        match={node.match}
        players={bracket.players}
        side={node.side}
      />
    );
  }
  return (
    <OutcomeCard
      canStart={canStart}
      label={`${roundLabel(node.round, bracket.roundCount)} · ${node.ordinal}`}
      match={node.match}
      onCorrectMatch={onCorrectMatch}
      onStartMatch={onStartMatch}
      players={bracket.players}
    />
  );
}

function TreeConnector({
  from,
  link,
  to,
}: {
  from?: PositionedNode;
  link: BracketLink;
  to?: PositionedNode;
}) {
  if (!from || !to) return null;
  const state =
    link.state === "complete"
      ? "complete"
      : link.state === "live"
        ? "live"
        : "waiting";
  if (link.kind === "championship") {
    return (
      <ChampionshipConnector
        className={`bracket-tree-link--${state}`}
        from={from}
        to={to}
      />
    );
  }
  const travelsRight = from.x < to.x;
  const fromX = travelsRight ? from.x + from.width : from.x;
  const toX = travelsRight ? to.x : to.x + to.width;
  const midpoint = (fromX + toX) / 2;
  return (
    <span
      aria-hidden="true"
      className={`bracket-tree-link bracket-tree-link--${state}`}
    >
      <i
        style={{
          left: Math.min(fromX, midpoint),
          top: from.y,
          width: Math.abs(midpoint - fromX),
        }}
      />
      <i
        style={{
          height: Math.abs(to.y - from.y),
          left: midpoint,
          top: Math.min(from.y, to.y),
        }}
      />
      <i
        style={{
          left: Math.min(midpoint, toX),
          top: to.y,
          width: Math.abs(toX - midpoint),
        }}
      />
    </span>
  );
}

function ChampionshipConnector({
  className,
  from,
  to,
}: {
  className: string;
  from: PositionedNode;
  to: PositionedNode;
}) {
  const fromX = from.x + from.width / 2;
  const fromY = from.y + from.height / 2;
  const toX = to.x + to.width / 2;
  const toY = to.y - to.height / 2;
  const jointY = toY - 28;
  return (
    <span
      aria-hidden="true"
      className={`bracket-tree-link bracket-tree-link--champion ${className}`}
    >
      <i
        style={{
          height: jointY - fromY,
          left: fromX,
          top: fromY,
        }}
      />
      <i
        style={{
          left: Math.min(fromX, toX),
          top: jointY,
          width: Math.abs(toX - fromX),
        }}
      />
      <i style={{ height: toY - jointY, left: toX, top: jointY }} />
    </span>
  );
}
