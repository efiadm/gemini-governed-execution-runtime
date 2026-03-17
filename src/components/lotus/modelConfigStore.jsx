// Global store for model configuration (API, Base URL, Model, and Price)
const CONFIG_KEY = "trident_model_config";

const defaultConfig = {
  apiKey: "",
  baseUrl: "",
  selectedModel: "",
  pricePer1M: 0,
};

let currentConfig = null;
const listeners = [];

function loadConfig() {
  if (typeof window === "undefined") return { ...defaultConfig };
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    return raw ? { ...defaultConfig, ...JSON.parse(raw) } : { ...defaultConfig };
  } catch {
    return { ...defaultConfig };
  }
}

export function getModelConfig() {
  if (!currentConfig) currentConfig = loadConfig();
  return { ...currentConfig };
}

export function updateModelConfig(updates) {
  currentConfig = { ...getModelConfig(), ...updates };
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(CONFIG_KEY, JSON.stringify(currentConfig));
    } catch (e) {
      console.warn("Failed to save model config:", e);
    }
  }
  listeners.forEach((cb) => cb({ ...currentConfig }));
}

export function subscribeToModelConfig(callback) {
  listeners.push(callback);
  return () => {
    const i = listeners.indexOf(callback);
    if (i > -1) listeners.splice(i, 1);
  };
}

export function resetModelConfig() {
  currentConfig = { ...defaultConfig };
  if (typeof window !== "undefined") {
    localStorage.removeItem(CONFIG_KEY);
  }
  listeners.forEach((cb) => cb({ ...currentConfig }));
}