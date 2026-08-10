"use client";

import { useReducedMotion } from "motion/react";
import type { ServiceSide, ServiceTurn } from "../../match/types";

export interface ServeGuideServer {
  name: string;
  side: ServiceSide;
  team: string;
  turn: ServiceTurn;
}

export function ServeGuide({
  courtEnd,
  isOpeningServe,
  server,
}: {
  courtEnd: "left" | "right";
  isOpeningServe: boolean;
  server: ServeGuideServer;
}) {
  const reducedMotion = useReducedMotion();
  const serverNumber = server.turn === "first" ? "1" : "2";
  const turn = isOpeningServe
    ? "Opening serve · Server 2"
    : `Server ${serverNumber}`;
  const end = courtEnd === "right" ? "near" : "far";
  const activeBox = `${end}-${server.side}`;
  const boxLabel = `${server.side} service box on the ${courtEnd} end`;
  const teamLabel = server.team.replace(/\s+\+\s+/g, " / ");

  return (
    <section
      aria-labelledby="serve-guide-title"
      className="serve-guide"
      data-qa="serve-guide"
    >
      <div className="serve-guide__inner">
        <div className="serve-guide__copy">
          <strong id="serve-guide-title">
            <span>{server.name}</span> is serving
          </strong>
          <span className="serve-guide__team">{teamLabel}</span>
          <span className="serve-guide__turn">{turn}</span>
        </div>
        <div
          aria-label={`Full pickleball court. ${server.name} serves from the ${boxLabel}.`}
          className={`serve-court serve-court--${activeBox}`}
          data-motion-state={reducedMotion ? "static" : activeBox}
          role="img"
        >
          <span aria-hidden="true" className="serve-court__surface">
            <span className="serve-court__net" />
            <span className="serve-court__nvz serve-court__nvz--far" />
            <span className="serve-court__nvz serve-court__nvz--near" />
            <span className="serve-court__center-line serve-court__center-line--far" />
            <span className="serve-court__center-line serve-court__center-line--near" />
            {(
              ["far-left", "far-right", "near-left", "near-right"] as const
            ).map((box) => (
              <span
                className={`serve-court__service-box serve-court__service-box--${box} ${box === activeBox ? "is-active" : ""}`}
                key={box}
              />
            ))}
          </span>
          <span aria-hidden="true" className="serve-court__player-marker">
            <span className="serve-court__player-head" />
            <span className="serve-court__player-torso" />
          </span>
        </div>
      </div>
    </section>
  );
}
