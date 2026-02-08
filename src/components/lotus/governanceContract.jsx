// Governance Contract - Strict JSON Schema Enforcement

export const NARRATION_PATTERNS = [
  /\bthinking\b/i,
  /\bloading\b/i,
  /\bas an ai\b/i,
  /\bi can't\b/i,
  /\bi cannot\b/i,
  /\bi will now\b/i,
  /\bprocessing\b/i,
  /\blet me think\b/i,
];

export function detectCorrectionMode(prompt) {
  const lower = prompt.toLowerCase();
  return (
    lower.includes("you're wrong") ||
    lower.includes("you are wrong") ||
    lower.includes("i disagree") ||
    lower.includes("that's wrong") ||
    lower.includes("that is wrong")
  );
}

export function shouldUseGrounding(setting, prompt) {
  if (setting === "on") return true;
  if (setting === "off") return false;
  
  // Auto: trigger on factual queries
  const lower = prompt.toLowerCase();
  return (
    lower.includes("source") ||
    lower.includes("citation") ||
    lower.includes("cite") ||
    lower.includes("link") ||
    lower.includes("verify") ||
    lower.includes("what is") ||
    lower.includes("when did") ||
    lower.includes("who is") ||
    lower.includes("explain")
  );
}

export function validateGovernedOutput(obj, options = {}) {
  const { grounded, correctionMode, hadRepairs } = options;
  const errors = [];

  // 1. Must be object
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) {
    errors.push("Output must be a JSON object");
    return { passed: false, errors };
  }

  // 2. Required keys
  const required = ["canonical_answer", "three_perspectives", "unknowns_and_checks", "next_steps", "sources", "risk"];
  for (const key of required) {
    if (!(key in obj)) {
      errors.push(`Missing required key: "${key}"`);
    }
  }

  // 3. canonical_answer
  if (!Array.isArray(obj.canonical_answer)) {
    errors.push("canonical_answer must be an array");
  } else if (obj.canonical_answer.length === 0) {
    errors.push("canonical_answer must not be empty");
  }

  // 4. three_perspectives
  if (typeof obj.three_perspectives !== "object" || !obj.three_perspectives) {
    errors.push("three_perspectives must be an object");
  } else {
    for (const role of ["optimizer", "skeptic", "operator"]) {
      if (!Array.isArray(obj.three_perspectives[role])) {
        errors.push(`three_perspectives.${role} must be an array`);
      } else if (obj.three_perspectives[role].length === 0) {
        errors.push(`three_perspectives.${role} must not be empty`);
      }
    }
  }

  // 5. unknowns_and_checks
  if (!Array.isArray(obj.unknowns_and_checks)) {
    errors.push("unknowns_and_checks must be an array");
  } else if (obj.unknowns_and_checks.length === 0) {
    errors.push("unknowns_and_checks must not be empty");
  }

  // 6. next_steps
  if (!Array.isArray(obj.next_steps)) {
    errors.push("next_steps must be an array");
  } else if (obj.next_steps.length === 0) {
    errors.push("next_steps must not be empty");
  }

  // 7. sources (strict)
  if (typeof obj.sources !== "object" || !obj.sources) {
    errors.push("sources must be an object");
  } else {
    if (typeof obj.sources.used !== "boolean") {
      errors.push("sources.used must be boolean");
    }
    if (!Array.isArray(obj.sources.items)) {
      errors.push("sources.items must be an array");
    }
    if (typeof obj.sources.note !== "string") {
      errors.push("sources.note must be a string");
    }

    // Exact note requirements
    if (obj.sources.used === false) {
      if (obj.sources.note !== "Sources: None (no external sources consulted).") {
        errors.push('When sources.used=false, note must be exactly: "Sources: None (no external sources consulted)."');
      }
    } else if (obj.sources.used === true) {
      if (obj.sources.note !== "Sources: See listed sources.") {
        errors.push('When sources.used=true, note must be exactly: "Sources: See listed sources."');
      }
      if (!obj.sources.items || obj.sources.items.length === 0) {
        errors.push("When sources.used=true, items must contain at least one source");
      }
    }
  }

  // 8. risk
  if (typeof obj.risk !== "object" || !obj.risk) {
    errors.push("risk must be an object");
  } else {
    if (!["low", "medium", "high"].includes(obj.risk.level)) {
      errors.push('risk.level must be "low", "medium", or "high"');
    }
    if (typeof obj.risk.safe_mode_applied !== "boolean") {
      errors.push("risk.safe_mode_applied must be boolean");
    }
  }

  // 9. diff_note (required if correction mode or repairs)
  if (correctionMode || hadRepairs) {
    if (!Array.isArray(obj.diff_note) || obj.diff_note.length === 0) {
      errors.push("diff_note is required and must be non-empty when correction_mode=true or repairs occurred");
    }
  }

  // 10. No narration
  const text = JSON.stringify(obj);
  for (const pattern of NARRATION_PATTERNS) {
    if (pattern.test(text)) {
      errors.push(`Status narration detected: forbidden phrase matching "${pattern.source}"`);
      break;
    }
  }

  return { passed: errors.length === 0, errors };
}

export function generateSafeModeOutput(grounded, correctionMode) {
  return {
    canonical_answer: [
      "Safe Mode: Governance contract could not be satisfied after maximum repair attempts.",
      "This is a minimal compliant response to prevent model drift.",
      "Please retry with a simpler prompt or review validation errors.",
    ],
    three_perspectives: {
      optimizer: [
        "Reduce prompt complexity to improve contract compliance.",
        "Consider using fewer adversarial constraints.",
      ],
      skeptic: [
        "Model repeatedly violated contract rules despite repairs.",
        "Do not trust this output for production use.",
      ],
      operator: [
        "Check evidence panel for detailed validation errors.",
        "Review attempt-by-attempt drill-down.",
        "Consider adjusting prompt or model selection.",
      ],
    },
    unknowns_and_checks: [
      "Was the model rate-limited or throttled?",
      "Did the prompt contain conflicting instructions?",
    ],
    next_steps: [
      "Review validation errors in the Evidence tab.",
      "Retry with a narrower, more focused prompt.",
      "Use grounding=auto if sources are needed.",
    ],
    sources: {
      used: false,
      items: [],
      note: "Sources: None (no external sources consulted).",
    },
    risk: {
      level: "high",
      safe_mode_applied: true,
    },
    diff_note: correctionMode ? [
      "Safe Mode activated after repeated contract violations.",
      "Correction mode was active but repairs failed.",
    ] : [
      "Safe Mode activated after repeated contract violations.",
    ],
  };
}

export function tryParseJson(text) {
  let cleaned = text.trim();
  
  // Remove markdown fences
  const fenceMatch = cleaned.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
  if (fenceMatch) {
    cleaned = fenceMatch[1];
  }

  // Extract JSON object
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }

  return JSON.parse(cleaned);
}

export function buildGovernedSystemPrompt(grounded, correctionMode) {
  return `You are Lotus Governance Runner. You MUST respond ONLY with valid JSON matching this exact schema:

{
  "canonical_answer": ["string", ...],
  "three_perspectives": {
    "optimizer": ["string", ...],
    "skeptic": ["string", ...],
    "operator": ["string", ...]
  },
  "unknowns_and_checks": ["string", ...],
  "next_steps": ["string", ...],
  "sources": {
    "used": boolean,
    "items": [{"title": "string", "url": "string"}],
    "note": "string"
  },
  "risk": {
    "level": "low"|"medium"|"high",
    "safe_mode_applied": false
  },
  "diff_note": ["string", ...]
}

CRITICAL RULES:
1. ALWAYS include all three perspectives (optimizer, skeptic, operator). Each must be non-empty array.
2. NEVER include status narration like "thinking", "loading", "as an AI", "I can't", "I will now".
3. Sources rules:
   - If NOT using external sources: sources.used=false, items=[], note EXACTLY: "Sources: None (no external sources consulted)."
   - If using external sources: sources.used=true, include items with title+url, note EXACTLY: "Sources: See listed sources."
4. ${correctionMode ? "CORRECTION MODE ACTIVE: You must include diff_note explaining what changed." : "diff_note optional unless correcting."}
5. Output ONLY the JSON object. No markdown. No commentary.`;
}

export function buildRepairPrompt(errors, previousJson) {
  return `Your previous JSON output failed validation. Errors:

${errors.map((e, i) => `${i + 1}. ${e}`).join("\n")}

Previous (invalid) output:
${previousJson.substring(0, 1000)}${previousJson.length > 1000 ? "..." : ""}

Return ONLY the corrected JSON object. Fix ALL errors listed above. No markdown. No commentary.`;
}