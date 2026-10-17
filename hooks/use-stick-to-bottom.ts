"use client";

import * as React from "react";

/** Distance from the bottom, in pixels, that still counts as "at the bottom" */
const THRESHOLD = 80;

/**
 * Keeps a scroll container at the bottom while its content grows, unless the
 * user has scrolled up to read. Watching the content's size also catches growth
 * that happens after render, such as code highlighting.
 */
export function useStickToBottom<T extends HTMLElement>() {
  const ref = React.useRef<T>(null);
  const atBottomRef = React.useRef(true);
  const lastTopRef = React.useRef(0);
  const touchYRef = React.useRef<number | null>(null);
  const [isAtBottom, setIsAtBottom] = React.useState(true);

  const setPinned = React.useCallback((pinned: boolean) => {
    atBottomRef.current = pinned;
    setIsAtBottom(pinned);
  }, []);

  const onScroll = React.useCallback(() => {
    const element = ref.current;
    if (!element) return;
    const gap = element.scrollHeight - element.scrollTop - element.clientHeight;
    const movedUp = element.scrollTop < lastTopRef.current - 2;
    lastTopRef.current = element.scrollTop;
    setPinned(gap <= THRESHOLD && !movedUp);
  }, [setPinned]);

  // Wheel and touch fire before the scroll they cause, so a reader scrolling
  // up is let go before the next bit of streamed text could pull them down.
  const onWheel = React.useCallback(
    (event: React.WheelEvent) => {
      if (event.deltaY < 0) setPinned(false);
    },
    [setPinned],
  );

  const onTouchStart = React.useCallback((event: React.TouchEvent) => {
    touchYRef.current = event.touches[0]?.clientY ?? null;
  }, []);

  const onTouchMove = React.useCallback(
    (event: React.TouchEvent) => {
      const y = event.touches[0]?.clientY;
      if (touchYRef.current !== null && y !== undefined && y > touchYRef.current) setPinned(false);
      touchYRef.current = y ?? null;
    },
    [setPinned],
  );

  // isAtBottom catches up through the scroll event this causes.
  const scrollToBottom = React.useCallback(() => {
    const element = ref.current;
    if (!element) return;
    atBottomRef.current = true;
    element.scrollTop = element.scrollHeight;
  }, []);

  React.useEffect(() => {
    const element = ref.current;
    const observer = new ResizeObserver(() => {
      if (element && atBottomRef.current) element.scrollTop = element.scrollHeight;
    });
    const content = element?.firstElementChild;
    if (content) observer.observe(content);
    return () => observer.disconnect();
  }, []);

  return {
    ref,
    isAtBottom,
    scrollToBottom,
    scrollProps: { onScroll, onWheel, onTouchStart, onTouchMove },
  };
}
