"use client";

import { ExternalLink, Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ChatError, checkApiKey } from "@/lib/chat-client";
import { API_KEY_URL, AVAILABLE_MODELS } from "@/lib/constants";
import { isAbortError } from "@/lib/error";
import type { GeminiModel } from "@/lib/types";

const KEY_ONLY_MODELS = AVAILABLE_MODELS.filter((model) => !model.sharedKey)
  .map((model) => model.name)
  .join(" and ");

/**
 * Explains why Google didn't accept a key, in terms of what to do next
 */
function keyProblem(err: unknown): string {
  if (err instanceof ChatError) {
    if (/api key not valid|api_key_invalid/i.test(err.message)) {
      return "Google didn't accept this key. Check that you copied all of it.";
    }
    if (/expired/i.test(err.message)) return "This key has expired. Create a new one.";
    return err.message;
  }
  return "Couldn't reach Google to check the key. Check your connection and try again.";
}

type ApiKeyDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  apiKey: string | null;
  /** The locked model that opened the dialog, if any */
  unlocking: GeminiModel | null;
  onSave: (apiKey: string) => void;
  onRemove: () => void;
};

/**
 * Adds, replaces or removes the user's own Gemini API key
 * The key is checked with Google before it's saved.
 */
export function ApiKeyDialog({
  open,
  onOpenChange,
  apiKey,
  unlocking,
  onSave,
  onRemove,
}: ApiKeyDialogProps) {
  const [draft, setDraft] = React.useState("");
  const [isVisible, setIsVisible] = React.useState(false);
  const [isChecking, setIsChecking] = React.useState(false);
  const [problem, setProblem] = React.useState<string | null>(null);
  const controllerRef = React.useRef<AbortController | null>(null);

  // Start fresh each time, and stop a check that's still running on close.
  const handleOpenChange = (next: boolean) => {
    if (!next) controllerRef.current?.abort();
    setDraft("");
    setIsVisible(false);
    setIsChecking(false);
    setProblem(null);
    onOpenChange(next);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const key = draft.trim();
    if (!key || isChecking) return;

    const controller = new AbortController();
    controllerRef.current = controller;
    setIsChecking(true);
    setProblem(null);
    try {
      await checkApiKey(key, controller.signal);
      onSave(key);
      handleOpenChange(false);
    } catch (err) {
      if (isAbortError(err)) return;
      setProblem(keyProblem(err));
      setIsChecking(false);
    }
  };

  const handleRemove = () => {
    onRemove();
    handleOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {apiKey ? "Your Gemini API key" : "Use your own Gemini API key"}
          </DialogTitle>
          <DialogDescription>
            {unlocking
              ? `${unlocking.name} needs a key of your own. With it, every reply uses your quota instead of the site's.`
              : `Your key unlocks ${KEY_ONLY_MODELS}, and every reply uses your quota instead of the site's.`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={(event) => void handleSubmit(event)} className="space-y-3">
          <div className="space-y-1.5">
            <label htmlFor="gemini-api-key" className="text-sm font-medium">
              {apiKey ? "Replace key" : "API key"}
            </label>
            <div className="relative">
              <Input
                id="gemini-api-key"
                type={isVisible ? "text" : "password"}
                value={draft}
                onChange={(event) => {
                  setDraft(event.target.value);
                  setProblem(null);
                }}
                placeholder={apiKey ? `Saved key ending in ${apiKey.slice(-4)}` : "AIza..."}
                autoComplete="off"
                spellCheck={false}
                autoFocus
                aria-invalid={problem !== null}
                aria-describedby={problem ? "gemini-api-key-problem" : undefined}
                className="pr-9 font-mono text-sm"
              />
              <button
                type="button"
                onClick={() => setIsVisible((visible) => !visible)}
                aria-label={isVisible ? "Hide key" : "Show key"}
                className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
              >
                {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {problem && (
              <p id="gemini-api-key-problem" role="alert" className="text-xs text-destructive">
                {problem}
              </p>
            )}
          </div>

          <p className="flex items-start gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="mt-px h-3.5 w-3.5 shrink-0" />
            <span>
              Stored only in this browser and sent straight to Google, never to this site&apos;s
              server.
            </span>
          </p>
          <p className="text-xs text-muted-foreground">
            <a
              href={API_KEY_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 font-medium text-foreground underline-offset-4 hover:underline"
            >
              Get a free key from Google AI Studio
              <ExternalLink className="h-3 w-3" />
            </a>
            . Free keys work for every model except {KEY_ONLY_MODELS}, which needs billing turned on
            for the key&apos;s project.
          </p>

          <DialogFooter className="gap-2 pt-2 sm:justify-between">
            {apiKey ? (
              <Button
                type="button"
                variant="ghost"
                onClick={handleRemove}
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                Remove key
              </Button>
            ) : (
              <span />
            )}
            <Button type="submit" disabled={!draft.trim() || isChecking}>
              {isChecking && <Loader2 className="h-4 w-4 animate-spin" />}
              {isChecking ? "Checking..." : "Save key"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
