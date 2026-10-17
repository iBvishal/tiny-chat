import { Check, ChevronDown, KeyRound, Lock } from "lucide-react";
import * as React from "react";

import { ApiKeyDialog } from "@/components/api-key-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { AVAILABLE_MODELS, getModel } from "@/lib/constants";
import type { GeminiModel } from "@/lib/types";

const SHARED_MODELS = AVAILABLE_MODELS.filter((model) => model.sharedKey);
const KEY_ONLY_MODELS = AVAILABLE_MODELS.filter((model) => !model.sharedKey);

function ModelItem({
  model,
  isSelected,
  isLocked,
  onSelect,
}: {
  model: GeminiModel;
  isSelected: boolean;
  isLocked: boolean;
  onSelect: () => void;
}) {
  return (
    <DropdownMenuItem
      onSelect={onSelect}
      className="flex cursor-pointer items-center justify-between px-3 py-2"
    >
      <div className={`flex flex-col ${isLocked ? "opacity-60" : ""}`}>
        <span className="font-medium">{model.name}</span>
        <span className="text-xs text-muted-foreground">{model.category}</span>
      </div>
      {isLocked ? (
        <Lock className="h-3.5 w-3.5 text-muted-foreground" aria-label="Needs your API key" />
      ) : (
        isSelected && <Check className="h-4 w-4 text-primary" />
      )}
    </DropdownMenuItem>
  );
}

/**
 * Picks the chat's model, and adds or changes the user's own API key, which
 * unlocks the models the site's shared key doesn't pay for
 */
export function ModelSelector({
  selectedModel,
  onModelChange,
  apiKey,
  onApiKeyChange,
}: {
  selectedModel: string;
  onModelChange: (model: string) => void;
  apiKey: string | null;
  onApiKeyChange: (apiKey: string | null) => void;
}) {
  const [isKeyDialogOpen, setIsKeyDialogOpen] = React.useState(false);
  const [unlocking, setUnlocking] = React.useState<GeminiModel | null>(null);
  const currentModel = getModel(selectedModel);

  const openKeyDialog = (model: GeminiModel | null) => {
    setUnlocking(model);
    setIsKeyDialogOpen(true);
  };

  const handleSave = (key: string) => {
    onApiKeyChange(key);
    // The model that asked for the key is the one they wanted.
    if (unlocking) onModelChange(unlocking.id);
  };

  return (
    <>
      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="flex h-8 items-center gap-1 px-2 text-xs font-medium hover:bg-muted"
              >
                {apiKey && <KeyRound className="h-3 w-3 text-muted-foreground" />}
                <span className="hidden sm:inline">{currentModel.name}</span>
                <span className="sm:hidden">{currentModel.name.replace(/^Gemini /, "")}</span>
                <ChevronDown className="h-3 w-3 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {apiKey ? "Select AI model (using your API key)" : "Select AI model"}
          </TooltipContent>
        </Tooltip>
        <DropdownMenuContent align="end" className="w-[260px]">
          {SHARED_MODELS.map((model) => (
            <ModelItem
              key={model.id}
              model={model}
              isSelected={currentModel.id === model.id}
              isLocked={false}
              onSelect={() => onModelChange(model.id)}
            />
          ))}

          <DropdownMenuSeparator />
          <DropdownMenuLabel className="px-3 text-xs font-normal text-muted-foreground">
            {apiKey ? "With your API key" : "Needs your API key"}
          </DropdownMenuLabel>
          {KEY_ONLY_MODELS.map((model) => (
            <ModelItem
              key={model.id}
              model={model}
              isSelected={currentModel.id === model.id}
              isLocked={!apiKey}
              onSelect={() => (apiKey ? onModelChange(model.id) : openKeyDialog(model))}
            />
          ))}

          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() => openKeyDialog(null)}
            className="flex cursor-pointer items-center gap-2 px-3 py-2"
          >
            <KeyRound className="h-4 w-4 text-muted-foreground" />
            {apiKey ? (
              <span className="flex flex-1 items-center justify-between">
                Your API key
                <span className="font-mono text-xs text-muted-foreground">
                  ••••{apiKey.slice(-4)}
                </span>
              </span>
            ) : (
              "Add your API key"
            )}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ApiKeyDialog
        open={isKeyDialogOpen}
        onOpenChange={setIsKeyDialogOpen}
        apiKey={apiKey}
        unlocking={unlocking}
        onSave={handleSave}
        onRemove={() => onApiKeyChange(null)}
      />
    </>
  );
}
