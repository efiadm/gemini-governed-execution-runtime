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
import { emitEvent, EventTypes } from "./eventBus";
import { updateRunState, addAttempt, addArtifact } from "./runStore";
import { attemptLocalRepair, ensureRequiredFields } from "./localRepair";
import { checkCache, saveToCache } from "./cacheReplay";

async function callModel(prompt, grounded) {
  try {
    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: grounded,
    });
    
    // Handle non-JSON responses
    if (typeof result === "string") {
      // Check if it's HTML or other non-JSON
      if (result.trim().startsWith("<") || result.includes("<!DOCTYPE")) {
        throw new Error("NON_JSON_HTML_RESPONSE");
      }
      return result;
    }
    
    return JSON.stringify(result);
  } catch (err) {
    if (err.message === "NON_JSON_HTML_RESPONSE") {
      throw err;
    }
    throw new Error(`Model call failed: ${err.message}`);
  }
}

export async function runBaseline(prompt, groundingSetting, model, onProgress) {
  const t0 = Date.now();
  const requestId = generateRequestId();
  
  emitEvent(EventTypes.RUN_STARTED, { mode: "baseline", requestId, prompt });
  
  onProgress?.("baseline_call");
  
  const useGrounding = shouldUseGrounding(groundingSetting, prompt);
  
  // Baseline: minimal system framing, no contract
  const systemPrompt = "You are a helpful AI assistant. Answer the user's question clearly and concisely.";
  const fullPrompt = `${systemPrompt}\n\nUser: ${prompt}`;
  
  emitEvent(EventTypes.MODEL_CALLED, { attempt: 1, kind: "initial" });
  
  let rawOutput;
  let responseType = "text";
  try {
    rawOutput = await callModel(fullPrompt, useGrounding);
  } catch (err) {
    if (err.message === "NON_JSON_HTML_RESPONSE") {
      responseType = "non_json";
      rawOutput = "HTML/Non-JSON response detected";
    } else {
      throw err;
    }
  }
  
  const latency = Date.now() - t0;
  
  emitEvent(EventTypes.MODEL_RESULT, { rawLength: rawOutput.length, latency });

  const evidence = {
    request_id: requestId,
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
    response_type: responseType,
    attemptDetails: [{
      attempt: 1,
      kind: "initial",
      ok: responseType === "text",
      model_ms: latency,
      local_ms: 0,
      errors: responseType === "non_json" ? ["Non-JSON response received"] : [],
      raw_preview: rawOutput.substring(0, 240),
      raw_full: rawOutput,
    }],
  };

  // Store minimal baseline_metrics artifact (execution only, no governance data)
  addArtifact({
    type: "baseline_metrics",
    mode: "baseline",
    timestamp: Date.now(),
    request_id: requestId,
    model_latency_ms: latency,
    prompt_tokens: estimateTokens(prompt),
    completion_tokens: estimateTokens(rawOutput),
    total_tokens: estimateTokens(prompt) + estimateTokens(rawOutput),
    output_hash: hashPrompt(rawOutput),
  });

  addAttempt({
    attempt: 1,
    kind: "initial",
    ok: true,
    model_ms: latency,
    local_ms: 0,
    errors: [],
    raw_preview: rawOutput.substring(0, 240),
    raw_full: rawOutput,
  });

  emitEvent(EventTypes.RUN_COMPLETED, { mode: "baseline", success: true });

  return {
    output: rawOutput,
    rawOutput,
    evidence,
  };
}

export async function runGoverned(prompt, groundingSetting, model, onProgress, settings = {}) {
  const t0 = Date.now();
  const requestId = generateRequestId();
  const useGrounding = shouldUseGrounding(groundingSetting, prompt);
  const correctionMode = detectCorrectionMode(prompt);
  const repairCap = settings.repairCap ?? 1;
  
  emitEvent(EventTypes.RUN_STARTED, { mode: "governed", requestId, prompt });
  
  const attemptDetails = [];
  let parsedOutput = null;
  let rawOutput = "";
  let validation = { passed: false, errors: [] };
  let repairs = 0;
  let safeModeApplied = false;
  let totalModelMs = 0;
  let totalLocalMs = 0;
  let executionTokensIn = 0;
  let executionTokensOut = 0;

  // Emit contract artifact
  addArtifact({ type: "contract", content: "Governed JSON Schema", mode: "governed", timestamp: Date.now() });
  emitEvent(EventTypes.ARTIFACT_EMITTED, { type: "contract" });

  onProgress?.("contract");
  const systemPrompt = buildGovernedSystemPrompt(useGrounding, correctionMode);

  // Attempt 1: Initial
  onProgress?.("validate");
  let currentPrompt = `${systemPrompt}\n\nUser prompt: ${prompt}`;
  
  emitEvent(EventTypes.MODEL_CALLED, { attempt: 1, kind: "initial" });
  let attemptStart = Date.now();
  rawOutput = await callModel(currentPrompt, useGrounding);
  let modelMs = Date.now() - attemptStart;
  totalModelMs += modelMs;
  emitEvent(EventTypes.MODEL_RESULT, { rawLength: rawOutput.length, modelMs });

  emitEvent(EventTypes.LOCAL_STEP, { step: "validation", attempt: 1 });
  let localStart = Date.now();
  let localRepairs = 0;
  
  // Try local repair first
  const localRepairResult = attemptLocalRepair(rawOutput);
  if (localRepairResult.success && localRepairResult.parsed) {
    localRepairs = localRepairResult.repairs.length;
    const fieldResult = ensureRequiredFields(localRepairResult.parsed, { grounded: useGrounding, correctionMode });
    if (fieldResult.modified) {
      localRepairs += fieldResult.addedFields.length;
    }
    parsedOutput = fieldResult.parsed;
    addArtifact({ 
      type: "local_repair", 
      repairs: localRepairResult.repairs.concat(fieldResult.addedFields.map(f => `added_field_${f}`)),
      mode: "governed", 
      timestamp: Date.now() 
    });
  } else {
    try {
      parsedOutput = tryParseJson(rawOutput);
    } catch (e) {
      parsedOutput = null;
      validation = { passed: false, errors: [`JSON parse failed: ${e.message}`] };
    }
  }
  
  if (parsedOutput) {
    validation = validateGovernedOutput(parsedOutput, { grounded: useGrounding, correctionMode, hadRepairs: false });
  }
  
  let localMs = Date.now() - localStart;
  totalLocalMs += localMs;
  
  emitEvent(EventTypes.VALIDATION_RESULT, { attempt: 1, passed: validation.passed, errors: validation.errors });

  const att1 = {
    attempt: 1,
    kind: "initial",
    ok: validation.passed,
    model_ms: modelMs,
    local_ms: localMs,
    errors: validation.errors,
    raw_preview: rawOutput.substring(0, 240),
    raw_full: rawOutput,
  };
  attemptDetails.push(att1);
  addAttempt(att1);

  // Repair loop (configurable cap)
  while (!validation.passed && repairs < repairCap) {
    onProgress?.("repair");
    repairs++;
    
    emitEvent(EventTypes.REPAIR_ATTEMPT, { repair: repairs });
    
    const repairPrompt = buildRepairPrompt(validation.errors, rawOutput);
    currentPrompt = `${systemPrompt}\n\n${repairPrompt}`;

    emitEvent(EventTypes.MODEL_CALLED, { attempt: 1 + repairs, kind: "repair" });
    attemptStart = Date.now();
    rawOutput = await callModel(currentPrompt, useGrounding);
    modelMs = Date.now() - attemptStart;
    totalModelMs += modelMs;
    emitEvent(EventTypes.MODEL_RESULT, { rawLength: rawOutput.length, modelMs });

    emitEvent(EventTypes.LOCAL_STEP, { step: "validation", attempt: 1 + repairs });
    localStart = Date.now();
    try {
      parsedOutput = tryParseJson(rawOutput);
      validation = validateGovernedOutput(parsedOutput, { grounded: useGrounding, correctionMode, hadRepairs: true });
    } catch (e) {
      parsedOutput = null;
      validation = { passed: false, errors: [`JSON parse failed on repair ${repairs}: ${e.message}`] };
    }
    localMs = Date.now() - localStart;
    totalLocalMs += localMs;
    
    emitEvent(EventTypes.VALIDATION_RESULT, { attempt: 1 + repairs, passed: validation.passed, errors: validation.errors });

    const attR = {
      attempt: 1 + repairs,
      kind: "repair",
      ok: validation.passed,
      model_ms: modelMs,
      local_ms: localMs,
      errors: validation.errors,
      raw_preview: rawOutput.substring(0, 240),
      raw_full: rawOutput,
    };
    attemptDetails.push(attR);
    addAttempt(attR);
  }

  // Safe mode fallback (fail-safe containment)
  if (!validation.passed) {
    emitEvent(EventTypes.LOCAL_STEP, { step: "safe_mode" });
    localStart = Date.now();
    parsedOutput = generateSafeModeOutput(useGrounding, correctionMode);
    safeModeApplied = true;
    validation = { passed: false, errors: ["Contract not satisfied within repair cap; output contained."] };
    totalLocalMs += Date.now() - localStart;
    
    // Always emit comprehensive artifacts for Model-Limited Execution
    addArtifact({ type: "contract", content: "Governed JSON Schema", mode: "governed", timestamp: Date.now() });
    addArtifact({ type: "safe_mode", reason: "Contract validation failed after repairs; fail-safe containment applied", mode: "governed", timestamp: Date.now() });
    if (localRepairs > 0) {
      addArtifact({ type: "local_repair", repairs: [`${localRepairs} local repairs attempted`], mode: "governed", timestamp: Date.now() });
    }
    addArtifact({ type: "contained_outcome", summary: "Model-Limited Execution: Output integrity preserved through fail-safe containment. Contract not satisfied, but execution completed successfully.", mode: "governed", timestamp: Date.now() });
  }

  onProgress?.("evidence");
  const totalLatency = Date.now() - t0;

  addArtifact({ 
    type: "execution_metrics", 
    billable_model_ms: totalModelMs, 
    runtime_local_ms: totalLocalMs, 
    mode: "governed", 
    timestamp: Date.now() 
  });
  emitEvent(EventTypes.ARTIFACT_EMITTED, { type: "performance" });
  
  emitEvent(EventTypes.RUN_COMPLETED, { mode: "governed", success: true, safeModeApplied });

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
      prompt_full: prompt,
      latency_ms: totalLatency,
      model_latency_ms: totalModelMs,
      local_latency_ms: totalLocalMs,
      attempts: attemptDetails.length,
      repairs,
      local_repairs: localRepairs,
      validation_passed: validation.passed && !safeModeApplied,
      safe_mode_applied: safeModeApplied,
      safe_mode_status: safeModeApplied ? "Contained (Fail-Safe)" : null,
      correction_mode: correctionMode,
      repair_cap: repairCap,
      audit_excluded: true,
      attemptDetails,
      validation_summary: {
        total_checks: Math.max(1, validation.errors.length + (validation.passed ? 5 : 0)),
        passed_checks: validation.passed && !safeModeApplied ? 5 : 0,
        failed_checks: safeModeApplied ? 1 : validation.errors.length,
        failures: safeModeApplied ? ["Contract not satisfied within repair cap; output contained."] : validation.errors,
      },
    },
  };
}

export async function runHybrid(prompt, groundingSetting, model, onProgress, settings = {}) {
  const t0 = Date.now();
  const requestId = generateRequestId();
  const useGrounding = shouldUseGrounding(groundingSetting, prompt);
  const correctionMode = detectCorrectionMode(prompt);
  const repairCap = settings.repairCap ?? 1;
  
  emitEvent(EventTypes.RUN_STARTED, { mode: "hybrid", requestId, prompt });
  
  const attemptDetails = [];
  let parsedOutput = null;
  let rawOutput = "";
  let validation = { passed: false, errors: [] };
  let repairs = 0;
  let localRepairs = 0;
  let safeModeApplied = false;
  let totalModelMs = 0;
  let totalLocalMs = 0;
  let contextInjected = false;
  let contextHeader = "";
  let tokensSaved = 0;

  // Emit contract artifact (same as Governed)
  addArtifact({ type: "contract", content: "Governed JSON Schema", mode: "hybrid", timestamp: Date.now() });
  emitEvent(EventTypes.ARTIFACT_EMITTED, { type: "contract" });

  onProgress?.("contract");
  
  // Hybrid: check artifact store for context
  emitEvent(EventTypes.LOCAL_STEP, { step: "artifact_context_check" });
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
    addArtifact({ type: "hybrid_context", header: contextHeader, tokens_saved: tokensSaved, mode: "hybrid", timestamp: Date.now() });
    emitEvent(EventTypes.ARTIFACT_EMITTED, { type: "hybrid_context", tokensSaved });
  }

  // Attempt 1: Initial
  onProgress?.("validate");
  let currentPrompt = `${systemPrompt}\n\nUser prompt: ${prompt}`;
  
  emitEvent(EventTypes.MODEL_CALLED, { attempt: 1, kind: "initial" });
  let attemptStart = Date.now();
  rawOutput = await callModel(currentPrompt, useGrounding);
  let modelMs = Date.now() - attemptStart;
  totalModelMs += modelMs;
  emitEvent(EventTypes.MODEL_RESULT, { rawLength: rawOutput.length, modelMs });

  emitEvent(EventTypes.LOCAL_STEP, { step: "validation", attempt: 1 });
  localStart = Date.now();
  
  // Local repair first
  const localRepairResult = attemptLocalRepair(rawOutput);
  if (localRepairResult.success && localRepairResult.parsed) {
    localRepairs = localRepairResult.repairs.length;
    const fieldResult = ensureRequiredFields(localRepairResult.parsed, { grounded: useGrounding, correctionMode });
    if (fieldResult.modified) {
      localRepairs += fieldResult.addedFields.length;
    }
    parsedOutput = fieldResult.parsed;
    addArtifact({ 
      type: "local_repair", 
      repairs: localRepairResult.repairs,
      mode: "hybrid", 
      timestamp: Date.now() 
    });
  } else {
    try {
      parsedOutput = tryParseJson(rawOutput);
    } catch (e) {
      parsedOutput = null;
      validation = { passed: false, errors: [`JSON parse failed: ${e.message}`] };
    }
  }
  
  if (parsedOutput) {
    validation = validateGovernedOutput(parsedOutput, { grounded: useGrounding, correctionMode, hadRepairs: false });
  }
  
  let localMs = Date.now() - localStart;
  totalLocalMs += localMs;
  
  emitEvent(EventTypes.VALIDATION_RESULT, { attempt: 1, passed: validation.passed, errors: validation.errors });

  const att1 = {
    attempt: 1,
    kind: "initial",
    ok: validation.passed,
    model_ms: modelMs,
    local_ms: localMs,
    errors: validation.errors,
    raw_preview: rawOutput.substring(0, 240),
    raw_full: rawOutput,
  };
  attemptDetails.push(att1);
  addAttempt(att1);

  // Hybrid: Use repair cap from settings
  if (!validation.passed && repairs < repairCap) {
    onProgress?.("repair");
    repairs++;
    
    emitEvent(EventTypes.REPAIR_ATTEMPT, { repair: repairs });
    
    const repairPrompt = buildRepairPrompt(validation.errors, rawOutput);
    currentPrompt = `${systemPrompt}\n\n${repairPrompt}`;

    emitEvent(EventTypes.MODEL_CALLED, { attempt: 2, kind: "repair" });
    attemptStart = Date.now();
    rawOutput = await callModel(currentPrompt, useGrounding);
    modelMs = Date.now() - attemptStart;
    totalModelMs += modelMs;
    emitEvent(EventTypes.MODEL_RESULT, { rawLength: rawOutput.length, modelMs });

    emitEvent(EventTypes.LOCAL_STEP, { step: "validation", attempt: 2 });
    localStart = Date.now();
    try {
      parsedOutput = tryParseJson(rawOutput);
      validation = validateGovernedOutput(parsedOutput, { grounded: useGrounding, correctionMode, hadRepairs: true });
    } catch (e) {
      parsedOutput = null;
      validation = { passed: false, errors: [`JSON parse failed on repair: ${e.message}`] };
    }
    localMs = Date.now() - localStart;
    totalLocalMs += localMs;
    
    emitEvent(EventTypes.VALIDATION_RESULT, { attempt: 2, passed: validation.passed, errors: validation.errors });

    const attR = {
      attempt: 2,
      kind: "repair",
      ok: validation.passed,
      model_ms: modelMs,
      local_ms: localMs,
      errors: validation.errors,
      raw_preview: rawOutput.substring(0, 240),
      raw_full: rawOutput,
    };
    attemptDetails.push(attR);
    addAttempt(attR);
  }

  // Safe mode fallback (fail-safe containment)
  if (!validation.passed) {
    emitEvent(EventTypes.LOCAL_STEP, { step: "safe_mode" });
    localStart = Date.now();
    parsedOutput = generateSafeModeOutput(useGrounding, correctionMode);
    safeModeApplied = true;
    validation = { passed: false, errors: ["Contract not satisfied within repair cap; output contained."] };
    totalLocalMs += Date.now() - localStart;
    
    // Always emit comprehensive artifacts for Model-Limited Execution
    addArtifact({ type: "contract", content: "Governed JSON Schema", mode: "hybrid", timestamp: Date.now() });
    addArtifact({ type: "safe_mode", reason: "Contract validation failed after Hybrid repairs; fail-safe containment applied", mode: "hybrid", timestamp: Date.now() });
    if (localRepairs > 0) {
      addArtifact({ type: "local_repair", repairs: [`${localRepairs} local repairs attempted`], mode: "hybrid", timestamp: Date.now() });
    }
    addArtifact({ type: "contained_outcome", summary: "Model-Limited Execution: Output integrity preserved through fail-safe containment. Contract not satisfied, but execution completed successfully.", mode: "hybrid", timestamp: Date.now() });
  }

  onProgress?.("evidence");
  const totalLatency = Date.now() - t0;

  addArtifact({ 
    type: "execution_metrics", 
    billable_model_ms: totalModelMs, 
    runtime_local_ms: totalLocalMs, 
    mode: "hybrid", 
    timestamp: Date.now() 
  });
  emitEvent(EventTypes.ARTIFACT_EMITTED, { type: "performance" });
  
  emitEvent(EventTypes.RUN_COMPLETED, { mode: "hybrid", success: true, safeModeApplied });

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
      local_repairs: localRepairs,
      validation_passed: validation.passed && !safeModeApplied,
      safe_mode_applied: safeModeApplied,
      safe_mode_status: safeModeApplied ? "Contained (Fail-Safe)" : null,
      correction_mode: correctionMode,
      repair_cap: repairCap,
      audit_excluded: true,
      hybrid_context_injected: contextInjected,
      hybrid_context_header: contextHeader,
      hybrid_tokens_saved: tokensSaved,
      attemptDetails,
      validation_summary: {
        total_checks: Math.max(1, validation.errors.length + (validation.passed ? 5 : 0)),
        passed_checks: validation.passed && !safeModeApplied ? 5 : 0,
        failed_checks: safeModeApplied ? 1 : validation.errors.length,
        failures: safeModeApplied ? ["Contract not satisfied within repair cap; output contained."] : validation.errors,
      },
    },
  };
}