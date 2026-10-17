import { describe, expect, it } from "vitest";

import { AVAILABLE_MODELS, DEFAULT_MODEL, getModel, getUsableModel } from "./constants";

describe("getUsableModel", () => {
  const keyOnly = AVAILABLE_MODELS.find((model) => !model.sharedKey)!;

  it("keeps a model that needs a key when there is one", () => {
    expect(getUsableModel(keyOnly.id, true).id).toBe(keyOnly.id);
  });

  it("falls back to the default without a key", () => {
    expect(getUsableModel(keyOnly.id, false).id).toBe(DEFAULT_MODEL);
  });

  it("keeps shared models either way, and drops retired ones", () => {
    expect(getUsableModel("gemini-3.5-flash-lite", false).id).toBe("gemini-3.5-flash-lite");
    expect(getUsableModel("gemini-1.5-pro", true).id).toBe(DEFAULT_MODEL);
  });

  it("only offers the default on the shared key", () => {
    expect(getModel(DEFAULT_MODEL).sharedKey).toBe(true);
  });
});
