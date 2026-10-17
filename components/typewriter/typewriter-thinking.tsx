"use client";

import * as React from "react";

import { THINKING_WORDS, THINKING_ANIMATION_SPEED, BLINK_INTERVAL } from "@/lib/constants";

type TypewriterThinkingProps = {
  done?: boolean;
};

/**
 * Animated "thinking" indicator component
 * Shows what the AI is doing before the response starts streaming
 */
export const TypewriterThinking = React.memo(function TypewriterThinking({
  done = false,
}: TypewriterThinkingProps) {
  const words = React.useMemo(() => THINKING_WORDS, []);
  const [index, setIndex] = React.useState(() => Math.floor(Math.random() * words.length));
  const [subIndex, setSubIndex] = React.useState(0);
  const [reverse, setReverse] = React.useState(false);
  const [blink, setBlink] = React.useState(true);

  // Typewriter effect logic
  React.useEffect(() => {
    if (done) return;

    if (subIndex === words[index].length + 1 && !reverse) {
      setTimeout(() => setReverse(true), THINKING_ANIMATION_SPEED.PAUSE_AT_WORD);
      return;
    }

    if (subIndex === 0 && reverse) {
      setReverse(false);
      setIndex((prev) => {
        let next;
        do {
          next = Math.floor(Math.random() * words.length);
        } while (next === prev && words.length > 1);
        return next;
      });
      return;
    }

    const timeout = setTimeout(
      () => {
        setSubIndex((prev) => prev + (reverse ? -1 : 1));
      },
      reverse ? THINKING_ANIMATION_SPEED.REVERSE : THINKING_ANIMATION_SPEED.FORWARD,
    );

    return () => clearTimeout(timeout);
  }, [subIndex, index, reverse, done, words]);

  // Cursor blink logic
  React.useEffect(() => {
    if (done) return;
    const timeout = setTimeout(() => {
      setBlink((prev) => !prev);
    }, BLINK_INTERVAL.THINKING);
    return () => clearTimeout(timeout);
  }, [blink, done]);

  if (done) {
    return (
      <div className="mb-2 flex items-center gap-0.5 font-mono text-[10px] font-bold tracking-widest text-muted-foreground/50 uppercase select-none">
        <span>tiny-response</span>
      </div>
    );
  }

  return (
    <div className="mt-4 ml-2 flex items-center gap-0.5 font-mono text-sm font-bold tracking-[0.1em] text-foreground uppercase select-none">
      <span>tiny-</span>
      <span>{words[index].substring(0, subIndex)}</span>
      <span
        className={`${blink ? "opacity-100" : "opacity-0"} mb-0.5 ml-1 inline-block h-4 w-1.5 bg-foreground align-middle transition-opacity duration-100`}
      />
    </div>
  );
});
