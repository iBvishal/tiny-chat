"use client";

import * as React from "react";

/**
 * localStorage keys for small preferences
 */
export const SETTINGS_KEYS = {
  DEFAULT_MODEL: "tiny-chat:default-model",
} as const;

const CHANGE_EVENT = "tiny-chat:settings-changed";

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    // Storage can be blocked, for example in some private windows.
    return null;
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

/**
 * A string preference kept in localStorage, shared by every component and tab
 * that reads it. Renders `fallback` on the server.
 */
export function useStoredString(key: string, fallback: string): [string, (value: string) => void] {
  const value = React.useSyncExternalStore(
    subscribe,
    () => read(key) ?? fallback,
    () => fallback,
  );

  const setValue = React.useCallback(
    (next: string) => {
      try {
        localStorage.setItem(key, next);
      } catch {
        // Keep working for this page view even if it can't be saved.
      }
      window.dispatchEvent(new Event(CHANGE_EVENT));
    },
    [key],
  );

  return [value, setValue];
}
