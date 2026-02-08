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

export function storeArtifact(title, summary) {
  if (typeof window === "undefined") return;
  
  const artifacts = JSON.parse(localStorage.getItem("lotus_artifacts") || "[]");
  artifacts.push({ title, summary, timestamp: Date.now() });
  
  if (artifacts.length > 10) {
    artifacts.shift();
  }
  
  localStorage.setItem("lotus_artifacts", JSON.stringify(artifacts));
}