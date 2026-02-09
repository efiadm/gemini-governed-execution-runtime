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
/**
 * Builds the canonical normalized performance object consumed by UI
 * Separates Execution (Plane A), Runtime-Local (Plane B), Repairs (Plane C), and Audit
 */
export function buildNormalizedPerformance(evidence, rawOutput, prompt, mode, model, grounding) {
  if (!evidence) {
    return {
      execution: { mode, model, grounding, prompt_tokens_in: 0, completion_tokens_out: 0, total_model_tokens: 0, model_latency_ms: 0, end_to_end_latency_ms: 0, repairs_used: 0, extra_model_calls: 0, extra_tokens_repairs: 0 },
      runtime_local: { validation_ms: 0, parse_ms: 0, render_ms: 0, evidence_assembly_ms: 0, artifact_io_ms: 0, total_runtime_local_ms: 0 },
      repairs: { triggered: false, calls: 0, billable_ms: 0, billable_tokens: 0, notes: [] },
      audit: { enabled: false, status: "off", billable_ms: 0, billable_tokens: 0, model: null, started_at: null, finished_at: null, error: null },
    };
  }

  const attempts = evidence?.attempts || 1;
  const repairs = Math.max(0, evidence?.repairs || 0);
  const basePromptTokens = estimateTokens(prompt);
  const baseCompletionTokens = estimateTokens(rawOutput || "");
  const totalPromptTokens = basePromptTokens * attempts;
  const totalCompletionTokens = baseCompletionTokens * attempts;
  const totalModelTokens = totalPromptTokens + totalCompletionTokens;
  const extraTokensDueToRepair = Math.max(0, (attempts - 1) * (basePromptTokens + baseCompletionTokens));
  
  const modelLatency = evidence?.model_latency_ms || 0;
  const localLatency = evidence?.local_latency_ms || 0;
  const totalLatency = evidence?.latency_ms || 0;
  
  let repairModelLatency = 0;
  if (attempts > 1 && modelLatency > 0) {
    repairModelLatency = Math.round((modelLatency / attempts) * (attempts - 1));
  }
  
  // Plane B breakdown
  let validationMs = 0, parseMs = 0, renderMs = 0, evidenceAssemblyMs = 0, artifactIoMs = 0;
  if (localLatency > 0) {
    const attemptDetails = evidence?.attemptDetails || [];
    if (attemptDetails.length > 0) {
      validationMs = attemptDetails.reduce((sum, att) => sum + (att.local_ms || 0), 0);
      parseMs = Math.round(validationMs * 0.2);
      renderMs = Math.round(validationMs * 0.15);
      evidenceAssemblyMs = Math.round(validationMs * 0.1);
      artifactIoMs = Math.max(0, localLatency - validationMs - parseMs - renderMs - evidenceAssemblyMs);
    } else {
      validationMs = Math.round(localLatency * 0.5);
      parseMs = Math.round(localLatency * 0.15);
      renderMs = Math.round(localLatency * 0.15);
      evidenceAssemblyMs = Math.round(localLatency * 0.1);
      artifactIoMs = Math.round(localLatency * 0.1);
    }
  }

  return {
    execution: {
      mode,
      model,
      grounding,
      prompt_tokens_in: totalPromptTokens,
      completion_tokens_out: totalCompletionTokens,
      total_model_tokens: totalModelTokens,
      model_latency_ms: modelLatency,
      end_to_end_latency_ms: totalLatency,
      repairs_used: repairs,
      extra_model_calls: Math.max(0, attempts - 1),
      extra_tokens_repairs: extraTokensDueToRepair,
    },
    runtime_local: {
      validation_ms: validationMs,
      parse_ms: parseMs,
      render_ms: renderMs,
      evidence_assembly_ms: evidenceAssemblyMs,
      artifact_io_ms: artifactIoMs,
      total_runtime_local_ms: localLatency,
    },
    repairs: {
      triggered: repairs > 0,
      calls: repairs,
      billable_ms: repairModelLatency,
      billable_tokens: extraTokensDueToRepair,
      notes: repairs > 0 ? ["Repair loop triggered on validation failure"] : [],
    },
    audit: {
      enabled: false,
      status: "off",
      billable_ms: 0,
      billable_tokens: 0,
      model: null,
      started_at: null,
      finished_at: null,
      error: null,
    },
  };
}

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
  let validationMs = 0;
  let renderMs = 0;
  let evidenceAssemblyMs = 0;
  
  if (localLatency > 0) {
    const attemptDetails = evidence?.attemptDetails || [];
    
    if (attemptDetails.length > 0) {
      validationMs = attemptDetails.reduce((sum, att) => sum + (att.local_ms || 0), 0);
      renderMs = Math.round(validationMs * 0.1);
      evidenceAssemblyMs = Math.max(0, localLatency - validationMs - renderMs);
    } else {
      validationMs = Math.round(localLatency * 0.7);
      renderMs = Math.round(localLatency * 0.15);
      evidenceAssemblyMs = Math.round(localLatency * 0.15);
    }
  }
  
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
    runtime_local: {
      validation_ms: validationMs,
      render_ms: renderMs,
      evidence_assembly_ms: evidenceAssemblyMs,
      total_runtime_local_ms: localLatency,
    },
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