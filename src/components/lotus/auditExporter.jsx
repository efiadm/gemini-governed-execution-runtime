// Evidence export for external audit runner
import { getRunState, getRunHistory, getBaselineSnapshot } from "./runStore";

export function exportEvidenceJSON() {
  const runState = getRunState();
  const history = getRunHistory();
  
  const evidence = {
    export_timestamp: new Date().toISOString(),
    export_version: "1.0.0",
    current_run: runState.run_id ? {
      run_id: runState.run_id,
      timestamp: runState.timestamp,
      mode: runState.mode,
      model: runState.model,
      grounding: runState.grounding,
      prompt_hash: runState.prompt_hash,
      prompt_text: runState.prompt_text,
      evidence: runState.evidence,
      validation: runState.validation,
      performance: runState.performance,
      artifacts: runState.artifacts,
      attempt_history: runState.attempt_history,
      drift: runState.drift,
      hallucination: runState.hallucination,
    } : null,
    run_history: history.map(run => ({
      run_id: run.run_id,
      timestamp: run.timestamp,
      mode: run.mode,
      model: run.model,
      grounding: run.grounding,
      prompt_hash: run.prompt_hash,
      evidence: run.evidence,
      validation: run.validation,
      performance: run.performance,
    })),
    baseline_snapshots: getBaselineSnapshots(),
    audit_metadata: {
      total_runs: history.length,
      modes_tested: [...new Set(history.map(r => r.mode))],
      models_used: [...new Set(history.map(r => r.model))],
    },
  };
  
  return evidence;
}

function getBaselineSnapshots() {
  if (typeof window === "undefined") return {};
  
  const snapshots = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.includes("baseline_snapshot_")) {
      try {
        snapshots[key] = JSON.parse(localStorage.getItem(key));
      } catch (e) {
        console.warn("Failed to parse baseline snapshot:", key);
      }
    }
  }
  return snapshots;
}

export function downloadEvidenceFile() {
  const evidence = exportEvidenceJSON();
  const blob = new Blob([JSON.stringify(evidence, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `trident-evidence-${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function generateAuditReport(evidenceJSON) {
  // This function can be used by an external Node script
  const report = {
    summary: {
      total_runs: evidenceJSON.run_history?.length || 0,
      modes: evidenceJSON.audit_metadata?.modes_tested || [],
      models: evidenceJSON.audit_metadata?.models_used || [],
    },
    validation_stats: calculateValidationStats(evidenceJSON.run_history || []),
    performance_summary: calculatePerformanceSummary(evidenceJSON.run_history || []),
    drift_analysis: analyzeDriftPatterns(evidenceJSON.run_history || []),
    recommendations: generateRecommendations(evidenceJSON),
  };
  
  return report;
}

function calculateValidationStats(history) {
  const stats = {
    total: history.length,
    passed: 0,
    failed: 0,
    safe_mode: 0,
    avg_repairs: 0,
    avg_local_repairs: 0,
  };
  
  history.forEach(run => {
    if (run.validation?.passed) stats.passed++;
    else stats.failed++;
    
    if (run.evidence?.safe_mode_applied) stats.safe_mode++;
    stats.avg_repairs += run.validation?.repairs || 0;
    stats.avg_local_repairs += run.validation?.local_repairs || 0;
  });
  
  stats.avg_repairs = (stats.avg_repairs / history.length).toFixed(2);
  stats.avg_local_repairs = (stats.avg_local_repairs / history.length).toFixed(2);
  
  return stats;
}

function calculatePerformanceSummary(history) {
  const summary = {
    avg_latency_ms: 0,
    avg_model_latency_ms: 0,
    avg_local_latency_ms: 0,
    avg_tokens: 0,
  };
  
  let count = 0;
  history.forEach(run => {
    if (run.evidence) {
      summary.avg_latency_ms += run.evidence.latency_ms || 0;
      summary.avg_model_latency_ms += run.evidence.model_latency_ms || 0;
      summary.avg_local_latency_ms += run.evidence.local_latency_ms || 0;
      count++;
    }
  });
  
  if (count > 0) {
    summary.avg_latency_ms = (summary.avg_latency_ms / count).toFixed(0);
    summary.avg_model_latency_ms = (summary.avg_model_latency_ms / count).toFixed(0);
    summary.avg_local_latency_ms = (summary.avg_local_latency_ms / count).toFixed(0);
  }
  
  return summary;
}

function analyzeDriftPatterns(history) {
  const patterns = {
    stability_issues: 0,
    authority_flags: 0,
    citation_issues: 0,
  };
  
  history.forEach(run => {
    if (run.drift) {
      if (run.drift.stability_score < 70) patterns.stability_issues++;
      if (run.drift.authority_flags?.length > 0) patterns.authority_flags++;
      if (run.hallucination?.citation_integrity?.score < 80) patterns.citation_issues++;
    }
  });
  
  return patterns;
}

function generateRecommendations(evidence) {
  const recommendations = [];
  
  const stats = calculateValidationStats(evidence.run_history || []);
  
  if (stats.safe_mode > stats.total * 0.3) {
    recommendations.push("High safe mode rate (>30%). Consider simplifying prompts or adjusting governance rules.");
  }
  
  if (parseFloat(stats.avg_repairs) > 1.5) {
    recommendations.push("High model repair rate. Consider enabling more aggressive local repair or adjusting contract strictness.");
  }
  
  if (parseFloat(stats.avg_local_repairs) < 0.5) {
    recommendations.push("Low local repair utilization. Local-first repair could reduce billable model calls.");
  }
  
  return recommendations;
}