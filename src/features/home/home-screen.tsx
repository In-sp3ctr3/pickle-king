"use client";

import { ActionButton } from "@/src/shared/ui";
import { ArrowRight, Download, Play, RotateCcw } from "lucide-react";
import { HomeCourtArt } from "./home-court-art";
import { HomeTitle } from "./home-title";

export interface HomeScreenProps {
  onStartTournament: () => void;
  onQuickMatch: () => void;
  onInstall?: () => void;
  onResume?: () => void;
  resumeLabel?: string;
}

export function HomeScreen({
  onStartTournament,
  onQuickMatch,
  onInstall,
  onResume,
  resumeLabel = "Resume tournament",
}: HomeScreenProps) {
  return (
    <main className="home-screen">
      <section className="home-copy">
        <div className="home-brand-lockup" aria-hidden="true">
          <span className="brand-mark" />
          <span>Pickle King</span>
        </div>
        <p className="home-eyebrow">One court · One crown</p>
        <HomeTitle />
        <p className="home-lede">
          Seed the crew. Run one match at a time. Give every winner a breather.
          Then crown the player who actually earned it.
        </p>

        <div className="home-actions">
          <ActionButton
            className="home-primary-action"
            data-qa="start-tournament"
            onClick={onStartTournament}
          >
            Start tournament
            <ArrowRight aria-hidden="true" size={19} strokeWidth={2.5} />
          </ActionButton>
          <ActionButton
            data-qa="quick-match"
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

      <section className="home-mechanism" aria-label="How Pickle King works">
        <HomeCourtArt />
      </section>
    </main>
  );
}
