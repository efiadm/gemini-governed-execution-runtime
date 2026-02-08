// Split Metrics Calculator - Billable vs Local

export function calculateMetrics(evidence, rawOutput, prompt, mode) {
  const metrics = {
    // A) Billable model tokens
    billable: {
      prompt_tokens_in: estimateTokens(prompt),
      completion_tokens_out: estimateTokens(rawOutput || ""),
      total_model_tokens: 0,
    },
    
    // B) Repair overhead
    repair: {
      repair_attempts_count: evidence?.repairs || 0,
      extra_model_calls_due_to_repair: evidence?.repairs || 0,
      extra_tokens_due_to_repair: 0,
    },
    
    // C) Tool/grounding overhead
    tools: {
      grounding_used: evidence?.grounding === "on" || evidence?.grounding === "auto",
      tool_calls_count: evidence?.grounding === "on" ? 1 : 0,
    },
    
    // D) Local runtime latency (non-billable)
    local: {
      local_validation_ms: 0,
      local_render_ms: 0,
      local_storage_ms: 0,
      total_local_ms: 0,
    },
    
    // E) Total end-to-end latency
    total: {
      total_latency_ms: evidence?.latency_ms || 0,
      model_latency_ms: evidence?.latency_ms || 0,
    },
  };
  
  // Calculate totals
  metrics.billable.total_model_tokens = 
    metrics.billable.prompt_tokens_in + metrics.billable.completion_tokens_out;
  
  // Estimate repair token overhead
  if (evidence?.repairs > 0) {
    metrics.repair.extra_tokens_due_to_repair = 
      evidence.repairs * (metrics.billable.prompt_tokens_in * 0.3 + 500);
  }
  
  // Estimate local processing time
  if (mode === "governed" || mode === "hybrid") {
    const validationCount = evidence?.attempts || 1;
    metrics.local.local_validation_ms = validationCount * 5; // ~5ms per validation
    metrics.local.local_render_ms = 10; // ~10ms render
    metrics.local.local_storage_ms = 5; // ~5ms storage
    metrics.local.total_local_ms = 
      metrics.local.local_validation_ms + 
      metrics.local.local_render_ms + 
      metrics.local.local_storage_ms;
  }
  
  // Model latency = total - local
  metrics.total.model_latency_ms = Math.max(0, 
    metrics.total.total_latency_ms - metrics.local.total_local_ms
  );
  
  return metrics;
}

export function calculateDeltaMetrics(currentMetrics, baselineMetrics) {
  if (!baselineMetrics) {
    return {
      delta_tokens_vs_baseline: 0,
      delta_latency_vs_baseline: 0,
      delta_tokens_pct: 0,
      delta_latency_pct: 0,
    };
  }
  
  const deltaTokens = currentMetrics.billable.total_model_tokens - 
    baselineMetrics.billable.total_model_tokens;
  const deltaLatency = currentMetrics.total.total_latency_ms - 
    baselineMetrics.total.total_latency_ms;
  
  return {
    delta_tokens_vs_baseline: deltaTokens,
    delta_latency_vs_baseline: deltaLatency,
    delta_tokens_pct: baselineMetrics.billable.total_model_tokens 
      ? Math.round((deltaTokens / baselineMetrics.billable.total_model_tokens) * 100)
      : 0,
    delta_latency_pct: baselineMetrics.total.total_latency_ms
      ? Math.round((deltaLatency / baselineMetrics.total.total_latency_ms) * 100)
      : 0,
  };
}

export function calculateTruncationRisk(totalTokens, contextLimit = 1000000) {
  return Math.min(100, Math.round((totalTokens / contextLimit) * 100));
}

export function calculateGovernanceROI(governedMetrics, baselineMetrics) {
  if (!baselineMetrics || !governedMetrics) return 0;
  
  // Simple formula: (reliability_gain - cost_increase) * 100
  // reliability_gain: validation pass rate (0-1)
  // cost_increase: token increase ratio (0-1+)
  
  const reliabilityGain = (governedMetrics.validation_pass_rate || 0) / 100;
  const tokenIncrease = governedMetrics.billable?.total_model_tokens && baselineMetrics.billable?.total_model_tokens
    ? governedMetrics.billable.total_model_tokens / baselineMetrics.billable.total_model_tokens - 1
    : 0;
  
  const roi = (reliabilityGain - tokenIncrease * 0.5) * 100;
  return Math.round(roi);
}

function estimateTokens(text) {
  return Math.ceil((text || "").length / 4);
}