// Cache/replay system for instant repeated demos with proof
const CACHE_KEY_PREFIX = "trident_cache_";
const MAX_CACHE_SIZE = 50;

function getCacheKey(prompt, model, grounding, mode) {
  const normalized = prompt.trim().toLowerCase();
  return `${CACHE_KEY_PREFIX}${mode}_${model}_${grounding}_${hashString(normalized)}`;
}

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

export function checkCache(prompt, model, grounding, mode) {
  if (typeof window === "undefined") return null;
  
  try {
    const key = getCacheKey(prompt, model, grounding, mode);
    const cached = localStorage.getItem(key);
    
    if (!cached) return null;
    
    const data = JSON.parse(cached);
    
    // Cache expires after 24 hours
    const age = Date.now() - data.timestamp;
    if (age > 24 * 60 * 60 * 1000) {
      localStorage.removeItem(key);
      return null;
    }
    
    return {
      ...data,
      cached: true,
      cache_age_ms: age,
    };
  } catch (e) {
    console.warn("Cache read failed:", e);
    return null;
  }
}

export function saveToCache(prompt, model, grounding, mode, evidence, output, rawOutput) {
  if (typeof window === "undefined") return;
  
  try {
    const key = getCacheKey(prompt, model, grounding, mode);
    
    const cacheData = {
      timestamp: Date.now(),
      prompt,
      model,
      grounding,
      mode,
      evidence,
      output,
      rawOutput,
    };
    
    localStorage.setItem(key, JSON.stringify(cacheData));
    
    // Prune old cache entries
    pruneCache();
  } catch (e) {
    console.warn("Cache write failed:", e);
  }
}

function pruneCache() {
  try {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CACHE_KEY_PREFIX)) {
        const data = JSON.parse(localStorage.getItem(key));
        keys.push({ key, timestamp: data.timestamp });
      }
    }
    
    if (keys.length <= MAX_CACHE_SIZE) return;
    
    // Remove oldest entries
    keys.sort((a, b) => a.timestamp - b.timestamp);
    const toRemove = keys.slice(0, keys.length - MAX_CACHE_SIZE);
    toRemove.forEach(({ key }) => localStorage.removeItem(key));
  } catch (e) {
    console.warn("Cache pruning failed:", e);
  }
}

export function clearCache() {
  if (typeof window === "undefined") return;
  
  try {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CACHE_KEY_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
  } catch (e) {
    console.warn("Cache clear failed:", e);
  }
}