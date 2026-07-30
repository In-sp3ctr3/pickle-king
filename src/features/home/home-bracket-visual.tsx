"use client";

import { Crown, TimerReset } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

const players = ["MJ", "RO", "KT", "SA"];

export function HomeBracketVisual() {
  const reducedMotion = useReducedMotion();
  const instant = reducedMotion ? { duration: 0 } : undefined;

  return (
    <>
      <p className="sr-only">Seed players, protect rest, crown a winner.</p>
      <div
        aria-hidden="true"
        className="relative min-h-[330px] overflow-hidden rounded-[28px] border border-[#2b3227] bg-[#11150f] p-5 sm:min-h-[390px] sm:p-8"
      >
        <div className="absolute inset-x-5 top-1/2 h-px bg-[#2b3227] sm:inset-x-8" />
        <div className="absolute top-5 bottom-5 left-1/2 w-px bg-[#2b3227] sm:top-8 sm:bottom-8" />

        <div className="relative grid h-full min-h-[288px] grid-cols-[1fr_1fr_0.85fr] items-center gap-3 sm:min-h-[326px] sm:gap-6">
          <div className="space-y-4">
            {players.map((player, index) => (
              <motion.div
                animate={{ opacity: 1, x: 0 }}
                className="flex h-12 items-center border-b border-[#3b4436] font-black tracking-[0.08em]"
                initial={reducedMotion ? false : { opacity: 0, x: -12 }}
                key={player}
                transition={{
                  delay: reducedMotion ? 0 : index * 0.06,
                  duration: reducedMotion ? 0 : 0.25,
                }}
              >
                <span className="mr-3 text-xs text-[#9da494]">{index + 1}</span>
                {player}
              </motion.div>
            ))}
          </div>

          <motion.div
            animate={{ opacity: 1, scaleX: 1 }}
            className="[transform-origin:left] space-y-14 border-r-2 border-[#c8ff3d] pr-3"
            initial={reducedMotion ? false : { opacity: 0, scaleX: 0 }}
            transition={
              instant ?? { delay: 0.25, duration: 0.4, ease: "easeOut" }
            }
          >
            <div className="flex h-12 items-center border-b-2 border-[#c8ff3d] text-sm font-extrabold sm:text-base">
              MJ
            </div>
            <div className="flex h-12 items-center border-b-2 border-[#c8ff3d] text-sm font-extrabold sm:text-base">
              SA
            </div>
          </motion.div>

          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-3 text-center"
            initial={reducedMotion ? false : { opacity: 0, y: -14 }}
            transition={
              instant ?? { delay: 0.82, duration: 0.45, ease: "easeOut" }
            }
          >
            <Crown className="text-[#c8ff3d]" size={32} strokeWidth={2.4} />
            <div className="flex size-16 items-center justify-center rounded-full border-4 border-[#c8ff3d] bg-[#f5f3e9] text-lg font-black text-[#090b08] sm:size-20">
              MJ
            </div>
            <span className="text-[0.65rem] font-extrabold tracking-[0.18em] text-[#c8ff3d] uppercase">
              Champion
            </span>
          </motion.div>
        </div>

        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="absolute right-5 bottom-4 flex items-center gap-2 rounded-full bg-[#20281b] px-3 py-2 text-[0.65rem] font-extrabold tracking-[0.12em] uppercase sm:right-8 sm:bottom-6"
          initial={reducedMotion ? false : { opacity: 0, y: 8 }}
          transition={
            instant ?? { delay: 0.65, duration: 0.2, ease: "easeOut" }
          }
        >
          <TimerReset className="text-[#c8ff3d]" size={15} />
          Rest protected
        </motion.div>
      </div>
    </>
  );
}
