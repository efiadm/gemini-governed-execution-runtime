// Single source of truth for available models
export const MODELS_REGISTRY = [
  { value: "gemini-2.0-flash-exp", label: "Gemini 2.0 Flash (Experimental)" },
  { value: "gemini-1.5-pro", label: "Gemini 1.5 Pro" },
  { value: "gemini-3-pro", label: "Gemini 3 Pro" },
];

export const DEFAULT_MODEL = "gemini-2.0-flash-exp";

const STORAGE_KEY = "lotus.model.selected";

export function getStoredModel() {
  if (typeof window === "undefined") return DEFAULT_MODEL;
  return localStorage.getItem(STORAGE_KEY) || DEFAULT_MODEL;
}

export function setStoredModel(model) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, model);
}