import { estimateTokens } from "./utils";

export function calculateMetrics(evidence, rawOutput, prompt, mode) {
  const metrics = {
    billable: {
      prompt_tokens_in: estimateTokens(prompt),
      completion_tokens_out: estimateTokens(rawOutput || ""),
      total_model_tokens: 0,
    },
    repair: {
      repair_attempts_count: evidence?.repairs || 0,
      extra_model_calls_due_to_repair: evidence?.repairs || 0,
      extra_tokens_due_to_repair: 0,
    },
    tools: {
      grounding_used: evidence?.grounding === "on",
      tool_calls_count: 0,
    },
    local: {
      local_validation_ms: 0,
      local_render_ms: 0,
      local_storage_ms: 0,
      total_local_ms: 0,
    },
    total: {
      total_latency_ms: evidence?.latency_ms || 0,
      model_latency_ms: evidence?.model_latency_ms || 0,
    },
    hybrid_tokens_saved: evidence?.hybrid_tokens_saved || 0,
  };

  metrics.billable.total_model_tokens = metrics.billable.prompt_tokens_in + metrics.billable.completion_tokens_out;

  if (evidence?.repairs > 0) {
    metrics.repair.extra_tokens_due_to_repair = evidence.repairs * (metrics.billable.prompt_tokens_in * 0.3 + 500);
  }

  if (mode === "governed" || mode === "hybrid") {
    const validationCount = evidence?.attempts || 1;
    metrics.local.local_validation_ms = validationCount * 5;
    metrics.local.local_render_ms = 10;
    metrics.local.local_storage_ms = 5;
    metrics.local.total_local_ms = metrics.local.local_validation_ms + metrics.local.local_render_ms + metrics.local.local_storage_ms;
  }

  return metrics;
}

export function calculateTruncationRisk(totalTokens, contextLimit = 1000000) {
  return Math.min(100, Math.round((totalTokens / contextLimit) * 100));
}