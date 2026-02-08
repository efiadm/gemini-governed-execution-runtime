// Settings store for Trident configuration
const SETTINGS_KEY = "trident_settings";

const defaultSettings = {
  repairCap: 1,
  outputCompactness: "compact",
  auditEnabled: true,
  auditDepth: "standard",
  auditModel: "cheaper",
};

let currentSettings = null;
const listeners = [];

function loadSettings() {
  if (typeof window === "undefined") return defaultSettings;
  
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    return stored ? { ...defaultSettings, ...JSON.parse(stored) } : defaultSettings;
  } catch {
    return defaultSettings;
  }
}

export function getSettings() {
  if (!currentSettings) {
    currentSettings = loadSettings();
  }
  return { ...currentSettings };
}

export function updateSettings(updates) {
  currentSettings = { ...getSettings(), ...updates };
  
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(currentSettings));
    } catch (e) {
      console.warn("Failed to save settings:", e);
    }
  }
  
  notifyListeners();
}

export function subscribeToSettings(callback) {
  listeners.push(callback);
  return () => {
    const index = listeners.indexOf(callback);
    if (index > -1) listeners.splice(index, 1);
  };
}

function notifyListeners() {
  listeners.forEach(cb => cb(currentSettings));
}

export function resetSettings() {
  currentSettings = { ...defaultSettings };
  if (typeof window !== "undefined") {
    localStorage.removeItem(SETTINGS_KEY);
  }
  notifyListeners();
}