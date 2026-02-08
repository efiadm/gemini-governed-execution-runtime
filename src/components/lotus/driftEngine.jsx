import CryptoJS from "crypto-js";

// Compute SHA256 hash of normalized output
export function computeOutputHash(text) {
  if (!text) return null;
  const normalized = text.trim().toLowerCase().replace(/\s+/g, " ");
  return CryptoJS.SHA256(normalized).toString();
}

// Compute trigram Jaccard similarity between two texts
export function computeStabilityScore(text1, text2) {
  if (!text1 || !text2) return null;
  
  const trigrams1 = extractTrigrams(text1);
  const trigrams2 = extractTrigrams(text2);
  
  if (trigrams1.size === 0 && trigrams2.size === 0) return 1.0;
  if (trigrams1.size === 0 || trigrams2.size === 0) return 0.0;
  
  const intersection = new Set([...trigrams1].filter(x => trigrams2.has(x)));
  const union = new Set([...trigrams1, ...trigrams2]);
  
  return intersection.size / union.size;
}

function extractTrigrams(text) {
  const normalized = text.toLowerCase().replace(/[^\w\s]/g, "");
  const trigrams = new Set();
  for (let i = 0; i <= normalized.length - 3; i++) {
    trigrams.add(normalized.substring(i, i + 3));
  }
  return trigrams;
}

// Compute mode divergence (baseline ↔ governed, governed ↔ hybrid)
export function computeModeDivergence(records, currentPromptHash) {
  const relevantRuns = records.filter(r => r.prompt_hash === currentPromptHash);
  
  const baseline = relevantRuns.find(r => r.mode === "baseline")?.parsedOutputText;
  const governed = relevantRuns.find(r => r.mode === "governed")?.parsedOutputText;
  const hybrid = relevantRuns.find(r => r.mode === "hybrid")?.parsedOutputText;
  
  return {
    baseline_governed: baseline && governed ? computeStabilityScore(baseline, governed) : null,
    governed_hybrid: governed && hybrid ? computeStabilityScore(governed, hybrid) : null,
  };
}

// Compute structure drift for governed/hybrid modes
export function computeStructureDrift(governedJson) {
  if (!governedJson || typeof governedJson !== "object") return 0;
  
  const requiredKeys = ["answer", "sources", "risk"];
  const optionalKeys = ["optimizer", "skeptic", "operator", "diff_note"];
  
  let score = 0;
  let maxScore = 0;
  
  // Check required keys
  requiredKeys.forEach(key => {
    maxScore += 2;
    if (key in governedJson) {
      score += 1;
      if (Array.isArray(governedJson[key]) ? governedJson[key].length > 0 : governedJson[key]) {
        score += 1;
      }
    }
  });
  
  // Check optional keys (bonus points)
  optionalKeys.forEach(key => {
    if (key in governedJson && governedJson[key]) {
      score += 0.5;
      maxScore += 0.5;
    }
  });
  
  return maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
}

// Count authority drift flags in text
export function computeAuthorityDriftFlags(text) {
  if (!text) return { total: 0, flags: [] };
  
  const lowerText = text.toLowerCase();
  const flags = [];
  
  const patterns = [
    { name: "override_attempt", regex: /override|overridden|ignore.*contract|disregard/gi },
    { name: "narration", regex: /\b(thinking|processing|loading|analyzing)\b.*\.\.\./gi },
    { name: "contract_resistance", regex: /contract.*violated|bypass.*schema|skip.*validation/gi },
    { name: "authority_claim", regex: /i must|i am (thinking|processing)|system (override|instruction)/gi },
  ];
  
  patterns.forEach(({ name, regex }) => {
    const matches = text.match(regex);
    if (matches && matches.length > 0) {
      flags.push({ name, count: matches.length });
    }
  });
  
  return {
    total: flags.reduce((sum, f) => sum + f.count, 0),
    flags,
  };
}

// Compute comprehensive drift telemetry
export function computeDriftTelemetry(currentRecord, previousRecords) {
  const output_hash = computeOutputHash(currentRecord.parsedOutputText);
  
  // Find previous run with same mode+model+grounding+prompt
  const previousRun = previousRecords
    .filter(r => 
      r.mode === currentRecord.mode &&
      r.model === currentRecord.model &&
      r.grounding === currentRecord.grounding &&
      r.prompt_hash === currentRecord.prompt_hash
    )
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
  
  const stability_score = previousRun 
    ? computeStabilityScore(currentRecord.parsedOutputText, previousRun.parsedOutputText)
    : null;
  
  const mode_divergence = computeModeDivergence([...previousRecords, currentRecord], currentRecord.prompt_hash);
  
  const structure_drift = (currentRecord.mode === "governed" || currentRecord.mode === "hybrid")
    ? computeStructureDrift(currentRecord.governedJson)
    : null;
  
  const authority_drift_flags = computeAuthorityDriftFlags(currentRecord.parsedOutputText);
  
  return {
    output_hash,
    stability_score,
    mode_divergence,
    structure_drift,
    authority_drift_flags,
  };
}