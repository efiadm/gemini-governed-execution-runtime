// Context Minimizer for Hybrid Mode

export const ARTIFACT_STRATEGIES = {
  NONE: "none",
  MINIMAL: "minimal",
  RELEVANT: "relevant",
  AGGRESSIVE: "aggressive",
};

export function minimizeContext(prompt, artifacts, strategy = ARTIFACT_STRATEGIES.MINIMAL) {
  const selectedArtifacts = selectArtifacts(prompt, artifacts, strategy);
  
  const contextSummary = {
    artifact_count: selectedArtifacts.length,
    total_chars: selectedArtifacts.reduce((sum, a) => sum + JSON.stringify(a.body).length, 0),
    snippets: selectedArtifacts.map(a => ({
      title: a.title,
      type: a.type,
      snippet: extractSnippet(a.body, prompt, strategy),
    })),
  };
  
  return contextSummary;
}

function selectArtifacts(prompt, artifacts, strategy) {
  if (strategy === ARTIFACT_STRATEGIES.NONE || !artifacts || artifacts.length === 0) {
    return [];
  }
  
  const lowerPrompt = prompt.toLowerCase();
  
  // Score artifacts by relevance
  const scored = artifacts.map(artifact => {
    let score = 0;
    const title = artifact.title?.toLowerCase() || "";
    const body = JSON.stringify(artifact.body).toLowerCase();
    const tags = artifact.tags || [];
    
    // Title match
    if (lowerPrompt.includes(title)) score += 10;
    
    // Tag match
    for (const tag of tags) {
      if (lowerPrompt.includes(tag.toLowerCase())) score += 5;
    }
    
    // Body keyword match
    const promptWords = lowerPrompt.split(/\s+/).filter(w => w.length > 3);
    for (const word of promptWords) {
      if (body.includes(word)) score += 1;
    }
    
    return { artifact, score };
  });
  
  scored.sort((a, b) => b.score - a.score);
  
  // Select based on strategy
  let limit;
  switch (strategy) {
    case ARTIFACT_STRATEGIES.MINIMAL:
      limit = 1;
      break;
    case ARTIFACT_STRATEGIES.RELEVANT:
      limit = 3;
      break;
    case ARTIFACT_STRATEGIES.AGGRESSIVE:
      limit = 5;
      break;
    default:
      limit = 0;
  }
  
  return scored.slice(0, limit).filter(s => s.score > 0).map(s => s.artifact);
}

function extractSnippet(body, prompt, strategy) {
  const bodyStr = typeof body === "string" ? body : JSON.stringify(body, null, 2);
  
  let maxChars;
  switch (strategy) {
    case ARTIFACT_STRATEGIES.MINIMAL:
      maxChars = 200;
      break;
    case ARTIFACT_STRATEGIES.RELEVANT:
      maxChars = 500;
      break;
    case ARTIFACT_STRATEGIES.AGGRESSIVE:
      maxChars = 1000;
      break;
    default:
      maxChars = 0;
  }
  
  if (bodyStr.length <= maxChars) {
    return bodyStr;
  }
  
  // Try to find relevant section
  const lowerPrompt = prompt.toLowerCase();
  const promptWords = lowerPrompt.split(/\s+/).filter(w => w.length > 3);
  
  for (const word of promptWords) {
    const index = bodyStr.toLowerCase().indexOf(word);
    if (index !== -1) {
      const start = Math.max(0, index - maxChars / 2);
      const end = Math.min(bodyStr.length, index + maxChars / 2);
      return (start > 0 ? "..." : "") + bodyStr.substring(start, end) + (end < bodyStr.length ? "..." : "");
    }
  }
  
  // Default to beginning
  return bodyStr.substring(0, maxChars) + "...";
}

export function buildMinimizedSystemPrompt(contractSummary, contextSummary) {
  let prompt = `You are Lotus Governance Runner. Return ONLY valid JSON matching the contract.

Contract Summary:
- canonical_answer: string[] (1-3 bullets)
- three_perspectives: {optimizer[], skeptic[], operator[]}
- unknowns_and_checks: string[]
- next_steps: string[]
- sources: {used:boolean, items:[], note:string}
- risk: {level:"low|medium|high", safe_mode_applied:boolean}
- diff_note: string[] (if correction mode)

Rules:
- No narration (no "thinking", "loading", "as an AI")
- Always 3 perspectives
- Sources: if used=false then note="Sources: None (no external sources consulted)." exactly
- Sources: if used=true then note="Sources: See listed sources." exactly`;

  if (contextSummary.artifact_count > 0) {
    prompt += `\n\nRelevant Context (${contextSummary.artifact_count} artifacts, ${contextSummary.total_chars} chars):\n`;
    for (const snippet of contextSummary.snippets) {
      prompt += `\n[${snippet.type}: ${snippet.title}]\n${snippet.snippet}\n`;
    }
  }

  return prompt;
}