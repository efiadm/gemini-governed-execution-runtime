import { estimateTokens } from "./utils";

export async function getArtifactContext(prompt) {
  if (typeof window === "undefined") {
    return { summary: "", fullContext: "", shouldInject: false };
  }

  const artifacts = JSON.parse(localStorage.getItem("lotus_artifacts") || "[]");
  
  if (artifacts.length === 0) {
    return { summary: "", fullContext: "", shouldInject: false };
  }

  const recent = artifacts.slice(-3);
  const fullContext = recent.map(a => a.summary || "").join(" ");
  const summary = fullContext.substring(0, 100);

  return {
    summary,
    fullContext,
    shouldInject: estimateTokens(fullContext) > 50,
  };
}

export function shouldInjectContext(context, prompt) {
  if (!context.shouldInject) return false;
  
  const promptTokens = estimateTokens(prompt);
  const contextTokens = estimateTokens(context.fullContext);
  const summaryTokens = estimateTokens(context.summary);
  
  return contextTokens > summaryTokens + 20 && promptTokens < 500;
}

/**
 * Store artifact in runtime-local (app-side) storage
 * This is system-side storage, not user-local
 */
export function storeArtifact(title, summary) {
  if (typeof window === "undefined") return;
  
  const artifacts = JSON.parse(localStorage.getItem("lotus_artifacts") || "[]");
  artifacts.push({ 
    title, 
    summary, 
    timestamp: Date.now(),
    storage_type: "runtime_local" // Clarify this is app-side, not user-local
  });
  
  // Keep last 50 artifacts
  if (artifacts.length > 50) {
    artifacts.shift();
  }
  
  localStorage.setItem("lotus_artifacts", JSON.stringify(artifacts));
}

export function getAllArtifacts() {
  if (typeof window === "undefined") return [];
  return JSON.parse(localStorage.getItem("lotus_artifacts") || "[]");
}

export function getRecentArtifacts(count = 10) {
  const all = getAllArtifacts();
  return all.slice(-count);
}