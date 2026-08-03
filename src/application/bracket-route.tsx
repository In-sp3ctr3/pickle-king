"use client";

import { BracketScreen, type CorrectMatch } from "../features/bracket";
import {
  planLateEntry,
  renameTournamentPlayer,
  tournamentHasStarted,
} from "../tournament";
import type { Dispatch } from "react";
import type { AppAction, AppState } from "./types";
import { sessionTimeLabel, timingAdjustment } from "./timing-view";

export function TournamentBracketRoute({
  correctResult,
  dispatch,
  now,
  onQuickHandoff,
  state,
}: {
  correctResult: CorrectMatch;
  dispatch: Dispatch<AppAction>;
  now: number;
  onQuickHandoff: (name: string) => void;
  state: AppState;
}) {
  const bracket = state.tournament!;
  const config = state.setupDraft!.config;
  return (
    <BracketScreen
      bracket={bracket}
      onApplyLateEntry={(player, plan, declinedPlayerIds, removeTimeLimit) =>
        dispatch({
          type: "apply-late-entry",
          player,
          plan,
          declinedPlayerIds,
          removeTimeLimit,
          now: Date.now(),
        })
      }
      onCorrectMatch={correctResult}
      onEditDraw={(players, structural) => {
        if (!structural) {
          const currentNames = new Map(
            bracket.players.map(({ id, name }) => [id, name]),
          );
          players.forEach((player) => {
            if (currentNames.get(player.id) !== player.name) {
              dispatch({
                type: "rename-player",
                playerId: player.id,
                name: player.name,
                now: Date.now(),
              });
            }
          });
          return { kind: "saved" };
        }

        const currentById = new Map(
          bracket.players.map((player) => [player.id, player]),
        );
        const additions = players.filter(({ id }) => !currentById.has(id));
        const removed = bracket.players.some(
          ({ id }) => !players.some((player) => player.id === id),
        );
        const changedExisting = players.some((player) => {
          const before = currentById.get(player.id);
          return (
            before !== undefined &&
            (before.name !== player.name || before.rating !== player.rating)
          );
        });
        if (
          tournamentHasStarted(bracket) &&
          additions.length === 1 &&
          !removed &&
          !changedExisting
        ) {
          const player = additions[0];
          try {
            return {
              kind: "late-entry",
              player,
              plan: createPlan(state, player),
            };
          } catch (error) {
            return {
              kind: "blocked",
              player,
              message:
                error instanceof Error
                  ? error.message
                  : "This player cannot be inserted now.",
            };
          }
        }
        if (
          tournamentHasStarted(bracket) &&
          !window.confirm(
            "Changing the player field now will clear every score and result, then reseed the entire bracket. The original court deadline will stay in place. Continue?",
          )
        ) {
          return { kind: "saved" };
        }
        dispatch({ type: "rebuild-tournament", players, now: Date.now() });
        return { kind: "saved" };
      }}
      onQuickMatch={(player) => {
        onQuickHandoff(player.name);
        dispatch({ type: "navigate", screen: "quick-setup" });
      }}
      onRenamePlayer={(playerId, name) => {
        try {
          renameTournamentPlayer(bracket, playerId, name);
          dispatch({ type: "rename-player", playerId, name, now: Date.now() });
          return true;
        } catch (error) {
          window.alert(
            error instanceof Error
              ? error.message
              : "That name cannot be saved.",
          );
          return false;
        }
      }}
      onRebuildWithPlayer={(player) =>
        dispatch({
          type: "rebuild-tournament",
          players: [
            ...bracket.players.map(({ id, name, rating }) => ({
              id,
              name,
              rating,
            })),
            player,
          ],
          now: Date.now(),
        })
      }
      onReplanLateEntry={(player, declinedPlayerIds) =>
        createPlan(state, player, declinedPlayerIds)
      }
      onStartMatch={(matchId) =>
        dispatch({ type: "start-match", matchId, now: Date.now() })
      }
      onUndoLateEntry={() =>
        dispatch({ type: "undo-late-entry", now: Date.now() })
      }
      sessionLabel={sessionTimeLabel(
        state.sessionDeadline,
        Math.max(now, state.updatedAt),
      )}
      timingWarning={timingAdjustment(bracket, config)}
    />
  );
}

function createPlan(
  state: AppState,
  player: Parameters<typeof planLateEntry>[1],
  declinedPlayerIds?: string[],
) {
  return planLateEntry(state.tournament!, player, {
    now: Date.now(),
    randomSeed: state.setupDraft!.config.randomSeed,
    sessionDeadline: state.sessionDeadline,
    transitionSeconds: state.setupDraft!.config.transitionSeconds,
    declinedPlayerIds,
  });
}
