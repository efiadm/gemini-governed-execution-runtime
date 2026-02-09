import { estimateTokens } from "./utils";

/**
 * Calculates metrics from evidence following the Plane A/B/C model:
 * 
 * Plane A (Execution) - Billable model generation
 * - Base model latency (first attempt)
 * - Base tokens (pre-repair)
 * - Base cost
 * 
 * Plane B (Diagnostics) - NON-billable app-side work that OFFSETS Plane A
 * - "Runtime-local" = work done in the APPLICATION, not on model servers
 * - Validation time (parsing + contract checking)
 * - Render time (formatting + structuring)
 * - Evidence assembly (metadata + telemetry)
 * - This plane GROWS with governed/hybrid as more safeguards are added
 * - Baseline: 0ms (no governance), Governed/Hybrid: 10-50ms (active safeguards)
 * 
 * Plane C (Repairs) - Conditional billable recovery
 * - Extra model calls (attempts beyond first)
 * - Extra tokens (repair overhead)
 * - Repair latency (model time for repairs)
 * - Repair cost
 */
export function calculateMetrics(evidence, rawOutput, prompt, mode) {
  const attempts = evidence?.attempts || 1;
  const repairs = Math.max(0, evidence?.repairs || 0);
  
  // === PLANE A: Base Execution (first attempt) ===
  const basePromptTokens = estimateTokens(prompt);
  const baseCompletionTokens = estimateTokens(rawOutput || "");
  const baseTokensPerAttempt = basePromptTokens + baseCompletionTokens;
  
  // Total tokens across all attempts (Plane A + Plane C)
  const totalPromptTokens = basePromptTokens * attempts;
  const totalCompletionTokens = baseCompletionTokens * attempts;
  const totalModelTokens = totalPromptTokens + totalCompletionTokens;
  
  // === PLANE C: Repair overhead (attempts beyond first) ===
  const extraTokensDueToRepair = Math.max(0, (attempts - 1) * baseTokensPerAttempt);
  
  // Model latencies from evidence
  const totalLatency = evidence?.latency_ms || 0;
  const modelLatency = evidence?.model_latency_ms || 0;
  const localLatency = evidence?.local_latency_ms || 0;
  
  // Repair model latency (Plane C)
  let repairModelLatency = 0;
  if (attempts > 1 && modelLatency > 0) {
    const avgModelLatencyPerAttempt = modelLatency / attempts;
    repairModelLatency = Math.round(avgModelLatencyPerAttempt * (attempts - 1));
  }
  
  // Base model latency (Plane A - first attempt only)
  const baseModelLatency = Math.max(0, modelLatency - repairModelLatency);
  
  // === PLANE B: Runtime-Local (App-Side) breakdown ===
  // Plane B represents NON-BILLABLE app-side work (validation, parsing, evidence)
  // This is work done LOCALLY in the application runtime, NOT on the model side
  // Mode-agnostic: if local_latency_ms exists, break it down; otherwise = 0
  
  let validationMs = 0;
  let renderMs = 0;
  let evidenceAssemblyMs = 0;
  
  if (localLatency > 0) {
    // Break down local_latency_ms based on attempt details if available
    const attemptDetails = evidence?.attemptDetails || [];
    
    if (attemptDetails.length > 0) {
      // Sum local_ms from all attempts to get total validation time
      validationMs = attemptDetails.reduce((sum, att) => sum + (att.local_ms || 0), 0);
      
      // Estimate render time (formatting JSON, structuring output)
      // This is typically 5-15% of validation time
      renderMs = Math.round(validationMs * 0.1);
      
      // Evidence assembly is the remainder
      evidenceAssemblyMs = Math.max(0, localLatency - validationMs - renderMs);
    } else {
      // Fallback: distribute local_latency_ms across components
      // 70% validation, 15% render, 15% evidence assembly
      validationMs = Math.round(localLatency * 0.7);
      renderMs = Math.round(localLatency * 0.15);
      evidenceAssemblyMs = Math.round(localLatency * 0.15);
    }
  }
  // If localLatency = 0 (baseline), all Plane B values remain 0
  
  const metrics = {
    billable: {
      prompt_tokens_in: totalPromptTokens,
      completion_tokens_out: totalCompletionTokens,
      total_model_tokens: totalModelTokens,
    },
    repair: {
      repair_attempts_count: repairs,
      extra_model_calls_due_to_repair: Math.max(0, attempts - 1),
      extra_tokens_due_to_repair: extraTokensDueToRepair,
      repair_model_latency_ms: repairModelLatency,
    },
    tools: {
      grounding_used: evidence?.grounding === "on",
      tool_calls_count: 0,
    },
    // Plane B: Non-billable app runtime work (offsets Plane A)
    runtime_local: {
      validation_ms: validationMs,
      render_ms: renderMs,
      evidence_assembly_ms: evidenceAssemblyMs,
      total_runtime_local_ms: localLatency,
    },
    // Plane A: Base execution metrics
    total: {
      total_latency_ms: totalLatency,
      model_latency_ms: modelLatency,
      base_model_latency_ms: baseModelLatency,
      attempts: attempts,
    },
    hybrid_tokens_saved: evidence?.hybrid_tokens_saved || 0,
  };

  return metrics;
}

export function calculateTruncationRisk(totalTokens, contextLimit = 1000000) {
  return Math.min(100, Math.round((totalTokens / contextLimit) * 100));
}