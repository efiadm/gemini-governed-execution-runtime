// Local-first JSON repair pipeline to reduce billable model calls
// Attempts to fix common JSON issues WITHOUT calling the model

export function attemptLocalRepair(rawOutput) {
  const repairs = [];
  let repairedText = rawOutput;

  // 1. Strip markdown code fences
  if (repairedText.includes("```")) {
    const match = repairedText.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
    if (match) {
      repairedText = match[1];
      repairs.push("stripped_code_fences");
    }
  }

  // 2. Extract JSON if embedded in text
  if (!repairedText.trim().startsWith("{")) {
    const jsonMatch = repairedText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      repairedText = jsonMatch[0];
      repairs.push("extracted_json");
    }
  }

  // 3. Fix trailing commas
  repairedText = repairedText.replace(/,(\s*[}\]])/g, "$1");
  if (repairedText !== rawOutput) {
    repairs.push("removed_trailing_commas");
  }

  // 4. Fix single quotes to double quotes (safe version)
  const hasSingleQuotes = repairedText.includes("'");
  if (hasSingleQuotes) {
    // Only replace single quotes that look like property names or string values
    repairedText = repairedText.replace(/'([^']*?)':/g, '"$1":');
    repairedText = repairedText.replace(/:\s*'([^']*?)'/g, ': "$1"');
    repairs.push("fixed_single_quotes");
  }

  // 5. Try to parse and validate
  let parsed = null;
  let parseError = null;
  try {
    parsed = JSON.parse(repairedText);
  } catch (e) {
    parseError = e.message;
  }

  return {
    success: parsed !== null,
    repairedText,
    parsed,
    repairs,
    parseError,
  };
}

export function ensureRequiredFields(parsed, options = {}) {
  if (!parsed || typeof parsed !== "object") return parsed;

  const { grounded, correctionMode } = options;
  let modified = false;
  const addedFields = [];

  // Ensure required top-level fields
  if (!parsed.answer) {
    parsed.answer = "No answer provided.";
    modified = true;
    addedFields.push("answer");
  }

  if (!parsed.perspectives) {
    parsed.perspectives = [];
    modified = true;
    addedFields.push("perspectives");
  } else if (!Array.isArray(parsed.perspectives)) {
    parsed.perspectives = [];
    modified = true;
  }

  if (!parsed.sources) {
    parsed.sources = { used: grounded || false, items: [] };
    modified = true;
    addedFields.push("sources");
  }

  if (!parsed.risk) {
    parsed.risk = { level: "unknown", notes: [] };
    modified = true;
    addedFields.push("risk");
  } else if (typeof parsed.risk === "string") {
    parsed.risk = { level: parsed.risk, notes: [] };
    modified = true;
  }

  if (correctionMode && !parsed.diff_note) {
    parsed.diff_note = "Correction applied (auto-generated).";
    modified = true;
    addedFields.push("diff_note");
  }

  // Ensure diff_note exists if repairs occurred
  if (!parsed.diff_note && addedFields.length > 0) {
    parsed.diff_note = `Local repair added missing fields: ${addedFields.join(", ")}`;
    modified = true;
  }

  return { parsed, modified, addedFields };
}