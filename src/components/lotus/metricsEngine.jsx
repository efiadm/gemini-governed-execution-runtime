import { estimateTokens } from "./utils";

export function calculateMetrics(evidence, rawOutput, prompt, mode) {
  const attempts = evidence?.attempts || 1;
  const repairs = Math.max(0, evidence?.repairs || 0);
  
  // Base token estimates per attempt
  const basePromptTokens = estimateTokens(prompt);
  const baseCompletionTokens = estimateTokens(rawOutput || "");
  const baseTokensPerAttempt = basePromptTokens + baseCompletionTokens;
  
  // Total tokens accounting for all attempts
  const totalPromptTokens = basePromptTokens * attempts;
  const totalCompletionTokens = baseCompletionTokens * attempts;
  const totalModelTokens = totalPromptTokens + totalCompletionTokens;
  
  // Extra tokens due to repair (attempts beyond first)
  const extraTokensDueToRepair = Math.max(0, (attempts - 1) * baseTokensPerAttempt);
  
  // Use real evidence latencies
  const totalLatency = evidence?.latency_ms || 0;
  const modelLatency = evidence?.model_latency_ms || 0;
  const localLatency = evidence?.local_latency_ms || 0;
  
  // Repair model latency estimate (if multiple attempts)
  let repairModelLatency = 0;
  if (attempts > 1 && modelLatency > 0) {
    const avgModelLatencyPerAttempt = modelLatency / attempts;
    repairModelLatency = Math.round(avgModelLatencyPerAttempt * (attempts - 1));
  }
  
  // Base model latency (first attempt)
  const baseModelLatency = Math.max(0, modelLatency - repairModelLatency);
  
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
    local: {
      local_validation_ms: localLatency,
      local_render_ms: 0,
      total_local_ms: localLatency,
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