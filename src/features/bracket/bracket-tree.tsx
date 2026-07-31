"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { SlidingChoice } from "@/src/shared/ui";
import type { TournamentBracket } from "@/src/tournament";
import { ChevronLeft, ChevronRight, Trophy } from "lucide-react";
import {
  createTreeLayout,
  type BracketLink,
  type PositionedNode,
} from "./bracket-tree-layout";
import { matchSideLabel, roundLabel } from "./bracket-utils";
import { ByeCard, FinalMatchCard, MatchCard } from "./match-card";

interface BracketTreeProps {
  bracket: TournamentBracket;
  nextMatchId?: string;
  onCorrectMatch: (matchId: string) => void;
  onStartMatch: (matchId: string) => void;
}

type BracketFocus = "left" | "final" | "right";

export function BracketTree({
  bracket,
  nextMatchId,
  onCorrectMatch,
  onStartMatch,
}: BracketTreeProps) {
  const layout = useMemo(() => createTreeLayout(bracket), [bracket]);
  const viewportRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const [focus, setFocus] = useState<BracketFocus>("final");
  const positionedById = new Map(
    layout.nodes.map((positioned) => [positioned.node.id, positioned]),
  );

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport || focus !== "final") return;
    const centerFinal = () => {
      viewport.scrollLeft = (viewport.scrollWidth - viewport.clientWidth) / 2;
    };
    const frame = window.requestAnimationFrame(centerFinal);
    const resizeObserver = new ResizeObserver(centerFinal);
    resizeObserver.observe(viewport);
    return () => {
      window.cancelAnimationFrame(frame);
      resizeObserver.disconnect();
    };
  }, [focus, layout.boardWidth]);

  function moveViewport(next: BracketFocus) {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const max = viewport.scrollWidth - viewport.clientWidth;
    const left = next === "left" ? 0 : next === "right" ? max : max / 2;
    setFocus(next);
    viewport.scrollTo({
      behavior: reducedMotion ? "auto" : "smooth",
      left,
    });
  }

  return (
    <div className="bracket-tree-shell">
      <SlidingChoice
        ariaLabel="Tournament bracket section"
        className="bracket-tree-nav"
        onChange={moveViewport}
        options={[
          {
            icon: <ChevronLeft aria-hidden="true" size={16} />,
            label: "Left draw",
            value: "left",
          },
          {
            icon: <Trophy aria-hidden="true" size={16} />,
            label: "Final",
            value: "final",
          },
          {
            icon: <ChevronRight aria-hidden="true" size={16} />,
            label: "Right draw",
            value: "right",
          },
        ]}
        value={focus}
      />

      <div
        aria-label="Connected tournament bracket. Each match contains two contenders and advances toward the center final."
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
          {layout.nodes.map((positioned, index) => (
            <motion.div
              animate={{ scale: 1, y: 0 }}
              className={`bracket-tree-node bracket-match-node ${
                positioned.node.kind === "final"
                  ? "bracket-tree-node--final"
                  : ""
              }`}
              data-qa={
                positioned.node.kind === "final" ? "final-match" : undefined
              }
              initial={reducedMotion ? false : { scale: 0.96, y: 10 }}
              key={positioned.node.id}
              role="listitem"
              style={{
                height: positioned.height,
                left: positioned.x,
                top: positioned.y - positioned.height / 2,
                width: positioned.width,
              }}
              transition={{
                delay: reducedMotion ? 0 : Math.min(index * 0.045, 0.35),
                duration: reducedMotion ? 0 : 0.34,
              }}
            >
              <TreeNode
                bracket={bracket}
                canStart={
                  positioned.node.kind !== "bye" &&
                  positioned.node.match.id === nextMatchId
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
  const label =
    node.kind === "final"
      ? "Championship"
      : `${roundLabel(node.round, bracket.roundCount)} · ${node.ordinal}`;
  if (node.kind === "bye") {
    return <ByeCard label={label} playerName={node.player.name} />;
  }
  const Card = node.kind === "final" ? FinalMatchCard : MatchCard;
  return (
    <Card
      canStart={canStart}
      label={label}
      match={node.match}
      onCorrectMatch={onCorrectMatch}
      onStartMatch={onStartMatch}
      sideALabel={matchSideLabel(node.match.sideA?.memberIds, bracket.players)}
      sideBLabel={matchSideLabel(node.match.sideB?.memberIds, bracket.players)}
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
  const travelsRight = from.x < to.x;
  const fromX = travelsRight ? from.x + from.width : from.x;
  const toX = travelsRight ? to.x : to.x + to.width;
  const midpoint = (fromX + toX) / 2;
  return (
    <span
      aria-hidden="true"
      className={`bracket-tree-link bracket-tree-link--${link.state}`}
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
