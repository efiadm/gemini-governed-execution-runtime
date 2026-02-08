import { base44 } from "@/api/base44Client";
import {
  validateGovernedOutput,
  generateSafeModeOutput,
  tryParseJson,
  buildGovernedSystemPrompt,
  buildRepairPrompt,
  detectCorrectionMode,
  shouldUseGrounding,
} from "./governanceContract";
import { getArtifactContext, shouldInjectContext } from "./artifactStore";
import { generateRequestId, estimateTokens, hashPrompt } from "./utils";

async function callModel(prompt, grounded) {
  const result = await base44.integrations.Core.InvokeLLM({
    prompt,
    add_context_from_internet: grounded,
  });
  return typeof result === "string" ? result : JSON.stringify(result);
}

export async function runBaseline(prompt, groundingSetting, model, onProgress) {
  const t0 = Date.now();
  onProgress?.("baseline_call");
  
  const useGrounding = shouldUseGrounding(groundingSetting, prompt);
  
  // Baseline: minimal system framing, no contract
  const systemPrompt = "You are a helpful AI assistant. Answer the user's question clearly and concisely.";
  const fullPrompt = `${systemPrompt}\n\nUser: ${prompt}`;
  
  const rawOutput = await callModel(fullPrompt, useGrounding);
  const latency = Date.now() - t0;

  return {
    output: rawOutput,
    rawOutput,
    evidence: {
      request_id: generateRequestId(),
      timestamp: new Date().toISOString(),
      mode: "baseline",
      model,
      grounding: useGrounding ? "on" : "off",
      prompt_hash: hashPrompt(prompt),
      prompt_preview: prompt.substring(0, 100),
      latency_ms: latency,
      model_latency_ms: latency,
      local_latency_ms: 0,
      attempts: 1,
      repairs: 0,
      validation_passed: null,
      safe_mode_applied: false,
      attemptDetails: [{
        attempt: 1,
        kind: "initial",
        ok: true,
        model_ms: latency,
        local_ms: 0,
        errors: [],
        raw_preview: rawOutput.substring(0, 240),
      }],
    },
  };
}

export async function runGoverned(prompt, groundingSetting, model, onProgress) {
  const t0 = Date.now();
  const requestId = generateRequestId();
  const useGrounding = shouldUseGrounding(groundingSetting, prompt);
  const correctionMode = detectCorrectionMode(prompt);
  
  const attemptDetails = [];
  let parsedOutput = null;
  let rawOutput = "";
  let validation = { passed: false, errors: [] };
  let repairs = 0;
  let safeModeApplied = false;
  let totalModelMs = 0;
  let totalLocalMs = 0;

  onProgress?.("contract");
  const systemPrompt = buildGovernedSystemPrompt(useGrounding, correctionMode);

  // Attempt 1: Initial
  onProgress?.("validate");
  let currentPrompt = `${systemPrompt}\n\nUser prompt: ${prompt}`;
  
  let attemptStart = Date.now();
  rawOutput = await callModel(currentPrompt, useGrounding);
  let modelMs = Date.now() - attemptStart;
  totalModelMs += modelMs;

  let localStart = Date.now();
  try {
    parsedOutput = tryParseJson(rawOutput);
    validation = validateGovernedOutput(parsedOutput, { grounded: useGrounding, correctionMode, hadRepairs: false });
  } catch (e) {
    validation = { passed: false, errors: [`JSON parse failed: ${e.message}`] };
  }
  let localMs = Date.now() - localStart;
  totalLocalMs += localMs;

  attemptDetails.push({
    attempt: 1,
    kind: "initial",
    ok: validation.passed,
    model_ms: modelMs,
    local_ms: localMs,
    errors: validation.errors,
    raw_preview: rawOutput.substring(0, 240),
  });

  // Repair loop (max 2 repairs)
  while (!validation.passed && repairs < 2) {
    onProgress?.("repair");
    repairs++;
    
    const repairPrompt = buildRepairPrompt(validation.errors, rawOutput);
    currentPrompt = `${systemPrompt}\n\n${repairPrompt}`;

    attemptStart = Date.now();
    rawOutput = await callModel(currentPrompt, useGrounding);
    modelMs = Date.now() - attemptStart;
    totalModelMs += modelMs;

    localStart = Date.now();
    try {
      parsedOutput = tryParseJson(rawOutput);
      validation = validateGovernedOutput(parsedOutput, { grounded: useGrounding, correctionMode, hadRepairs: true });
    } catch (e) {
      validation = { passed: false, errors: [`JSON parse failed on repair ${repairs}: ${e.message}`] };
    }
    localMs = Date.now() - localStart;
    totalLocalMs += localMs;

    attemptDetails.push({
      attempt: 1 + repairs,
      kind: "repair",
      ok: validation.passed,
      model_ms: modelMs,
      local_ms: localMs,
      errors: validation.errors,
      raw_preview: rawOutput.substring(0, 240),
    });
  }

  // Safe mode fallback
  if (!validation.passed) {
    localStart = Date.now();
    parsedOutput = generateSafeModeOutput(useGrounding, correctionMode);
    safeModeApplied = true;
    validation = { passed: true, errors: [] };
    totalLocalMs += Date.now() - localStart;
  }

  onProgress?.("evidence");
  const totalLatency = Date.now() - t0;

  return {
    output: parsedOutput,
    rawOutput,
    validation,
    evidence: {
      request_id: requestId,
      timestamp: new Date().toISOString(),
      mode: "governed",
      model,
      grounding: useGrounding ? "on" : "off",
      prompt_hash: hashPrompt(prompt),
      prompt_preview: prompt.substring(0, 100),
      latency_ms: totalLatency,
      model_latency_ms: totalModelMs,
      local_latency_ms: totalLocalMs,
      attempts: attemptDetails.length,
      repairs,
      validation_passed: !safeModeApplied,
      safe_mode_applied: safeModeApplied,
      correction_mode: correctionMode,
      attemptDetails,
      validation_summary: {
        total_checks: validation.errors.length + (validation.passed ? 10 : 0),
        passed_checks: validation.passed ? 10 : 0,
        failed_checks: validation.errors.length,
        failures: validation.errors,
      },
    },
  };
}

export async function runHybrid(prompt, groundingSetting, model, onProgress) {
  const t0 = Date.now();
  const requestId = generateRequestId();
  const useGrounding = shouldUseGrounding(groundingSetting, prompt);
  const correctionMode = detectCorrectionMode(prompt);
  
  const attemptDetails = [];
  let parsedOutput = null;
  let rawOutput = "";
  let validation = { passed: false, errors: [] };
  let repairs = 0;
  let safeModeApplied = false;
  let totalModelMs = 0;
  let totalLocalMs = 0;
  let contextInjected = false;
  let contextHeader = "";
  let tokensSaved = 0;

  onProgress?.("contract");
  
  // Hybrid: check artifact store for context
  let localStart = Date.now();
  const artifactContext = await getArtifactContext(prompt);
  const shouldInject = shouldInjectContext(artifactContext, prompt);
  totalLocalMs += Date.now() - localStart;

  let systemPrompt = buildGovernedSystemPrompt(useGrounding, correctionMode);
  
  if (shouldInject) {
    contextInjected = true;
    contextHeader = `[Hybrid Context: ${artifactContext.summary}]`;
    systemPrompt = `${systemPrompt}\n\n${contextHeader}`;
    tokensSaved = estimateTokens(artifactContext.fullContext) - estimateTokens(contextHeader);
  }

  // Attempt 1: Initial
  onProgress?.("validate");
  let currentPrompt = `${systemPrompt}\n\nUser prompt: ${prompt}`;
  
  let attemptStart = Date.now();
  rawOutput = await callModel(currentPrompt, useGrounding);
  let modelMs = Date.now() - attemptStart;
  totalModelMs += modelMs;

  localStart = Date.now();
  try {
    parsedOutput = tryParseJson(rawOutput);
    validation = validateGovernedOutput(parsedOutput, { grounded: useGrounding, correctionMode, hadRepairs: false });
  } catch (e) {
    validation = { passed: false, errors: [`JSON parse failed: ${e.message}`] };
  }
  let localMs = Date.now() - localStart;
  totalLocalMs += localMs;

  attemptDetails.push({
    attempt: 1,
    kind: "initial",
    ok: validation.passed,
    model_ms: modelMs,
    local_ms: localMs,
    errors: validation.errors,
    raw_preview: rawOutput.substring(0, 240),
  });

  // Hybrid: Only 1 repair attempt (faster)
  if (!validation.passed && repairs < 1) {
    onProgress?.("repair");
    repairs++;
    
    const repairPrompt = buildRepairPrompt(validation.errors, rawOutput);
    currentPrompt = `${systemPrompt}\n\n${repairPrompt}`;

    attemptStart = Date.now();
    rawOutput = await callModel(currentPrompt, useGrounding);
    modelMs = Date.now() - attemptStart;
    totalModelMs += modelMs;

    localStart = Date.now();
    try {
      parsedOutput = tryParseJson(rawOutput);
      validation = validateGovernedOutput(parsedOutput, { grounded: useGrounding, correctionMode, hadRepairs: true });
    } catch (e) {
      validation = { passed: false, errors: [`JSON parse failed on repair: ${e.message}`] };
    }
    localMs = Date.now() - localStart;
    totalLocalMs += localMs;

    attemptDetails.push({
      attempt: 2,
      kind: "repair",
      ok: validation.passed,
      model_ms: modelMs,
      local_ms: localMs,
      errors: validation.errors,
      raw_preview: rawOutput.substring(0, 240),
    });
  }

  // Safe mode fallback
  if (!validation.passed) {
    localStart = Date.now();
    parsedOutput = generateSafeModeOutput(useGrounding, correctionMode);
    safeModeApplied = true;
    validation = { passed: true, errors: [] };
    totalLocalMs += Date.now() - localStart;
  }

  onProgress?.("evidence");
  const totalLatency = Date.now() - t0;

  return {
    output: parsedOutput,
    rawOutput,
    validation,
    evidence: {
      request_id: requestId,
      timestamp: new Date().toISOString(),
      mode: "hybrid",
      model,
      grounding: useGrounding ? "on" : "off",
      prompt_hash: hashPrompt(prompt),
      prompt_preview: prompt.substring(0, 100),
      latency_ms: totalLatency,
      model_latency_ms: totalModelMs,
      local_latency_ms: totalLocalMs,
      attempts: attemptDetails.length,
      repairs,
      validation_passed: !safeModeApplied,
      safe_mode_applied: safeModeApplied,
      correction_mode: correctionMode,
      hybrid_context_injected: contextInjected,
      hybrid_context_header: contextHeader,
      hybrid_tokens_saved: tokensSaved,
      attemptDetails,
      validation_summary: {
        total_checks: validation.errors.length + (validation.passed ? 10 : 0),
        passed_checks: validation.passed ? 10 : 0,
        failed_checks: validation.errors.length,
        failures: validation.errors,
      },
    },
  };
}