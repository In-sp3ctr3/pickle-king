"use client";

import { ActionButton } from "@/src/shared/ui";
import { ArrowRight, Download, History, Play, RotateCcw } from "lucide-react";
import { HomeMascot } from "./home-mascot";

export interface HomeScreenProps {
  onStartTournament: () => void;
  onQuickMatch: () => void;
  onInstall?: () => void;
  onResume?: () => void;
  onHistory?: () => void;
  resumeLabel?: string;
  hydrating?: boolean;
}

export function HomeScreen({
  onStartTournament,
  onQuickMatch,
  onInstall,
  onResume,
  onHistory,
  resumeLabel = "Resume tournament",
  hydrating = false,
}: HomeScreenProps) {
  return (
    <main aria-busy={hydrating} className="home-screen">
      <section className="home-copy">
        <p className="home-brand-lockup">Pickle King</p>
        <p className="home-eyebrow">One court · One crown</p>
        <h1>
          Settle it.
          <span>On court.</span>
        </h1>
        <p className="home-lede">
          Build the bracket. Keep the score. Crown the winner.
        </p>

        <div className="home-actions">
          <ActionButton
            className="home-primary-action"
            data-qa="start-tournament"
            disabled={hydrating}
            onClick={onStartTournament}
          >
            Start tournament
            <ArrowRight aria-hidden="true" size={19} strokeWidth={2.5} />
          </ActionButton>
          <ActionButton
            data-qa="quick-match"
            disabled={hydrating}
            onClick={onQuickMatch}
            variant="secondary"
          >
            <Play aria-hidden="true" size={18} fill="currentColor" />
            Quick match
          </ActionButton>
          {onResume ? (
            <ActionButton
              data-qa="resume-tournament"
              onClick={onResume}
              variant="quiet"
            >
              <RotateCcw aria-hidden="true" size={18} />
              {resumeLabel}
            </ActionButton>
          ) : null}
          {onHistory ? (
            <ActionButton
              data-qa="match-history"
              onClick={onHistory}
              variant="quiet"
            >
              <History aria-hidden="true" size={18} /> Match history
            </ActionButton>
          ) : null}
          {onInstall ? (
            <ActionButton
              data-qa="install-pwa"
              onClick={onInstall}
              variant="quiet"
            >
              <Download aria-hidden="true" size={18} />
              Install app
            </ActionButton>
          ) : null}
        </div>

        <p className="home-proof">Your names and scores stay on this device</p>
      </section>

      <section className="home-mechanism" aria-label="Pickle King mascot">
        <HomeMascot />
      </section>
    </main>
  );
}
