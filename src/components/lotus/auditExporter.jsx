// Evidence export for external audit runner
import { getRunState, getRunHistory, getBaselineSnapshot } from "./runStore";
import jsPDF from "jspdf";

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

let isDownloadingJSON = false;

export function downloadEvidenceFile() {
  if (isDownloadingJSON) return;
  isDownloadingJSON = true;
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
  setTimeout(() => { isDownloadingJSON = false; }, 0);
}

export function downloadAuditPdf() {
  const evidence = exportEvidenceJSON();
  const report = generateAuditReport(evidence);

  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const margin = 40;
  const pageH = doc.internal.pageSize.getHeight();
  const pageW = doc.internal.pageSize.getWidth();
  const maxW = pageW - margin * 2;
  const lineH = 14;
  let y = margin;

  const newPageIfNeeded = () => {
    if (y > pageH - margin) { doc.addPage(); y = margin; }
  };
  const addHeading = (t) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    const lines = doc.splitTextToSize(String(t ?? ""), maxW);
    lines.forEach(l => { newPageIfNeeded(); doc.text(l, margin, y); y += lineH; });
    y += 4;
    doc.setFont("helvetica", "normal");
  };
  const addText = (t) => {
    doc.setFontSize(11);
    const lines = doc.splitTextToSize(String(t ?? ""), maxW);
    lines.forEach(l => { newPageIfNeeded(); doc.text(l, margin, y); y += lineH; });
    y += 6;
  };

  addHeading("Governed Execution Report");
  addText(`Exported: ${new Date().toLocaleString()}`);

  if (report?.summary) {
    addHeading("Summary");
    addText(`Total runs: ${report.summary.total_runs}`);
    addText(`Modes: ${(report.summary.modes || []).join(", ")}`);
    addText(`Models: ${(report.summary.models || []).join(", ")}`);
  }

  if (report?.validation_stats) {
    addHeading("Validation Stats");
    addText(`Passed: ${report.validation_stats.passed}/${report.validation_stats.total}`);
    addText(`Safe mode: ${report.validation_stats.safe_mode}`);
    addText(`Avg repairs: ${report.validation_stats.avg_repairs}`);
    addText(`Avg local repairs: ${report.validation_stats.avg_local_repairs}`);
  }

  if (report?.performance_summary) {
    addHeading("Performance Summary");
    addText(`Avg latency: ${report.performance_summary.avg_latency_ms} ms`);
    addText(`Model latency: ${report.performance_summary.avg_model_latency_ms} ms`);
    addText(`Local latency: ${report.performance_summary.avg_local_latency_ms} ms`);
  }

  if (evidence?.current_run?.prompt_text) {
    addHeading("Prompt");
    addText(evidence.current_run.prompt_text);
  }

  const ans = evidence?.current_run?.evidence?.canonical_answer;
  if (ans) {
    addHeading("Answer");
    addText(Array.isArray(ans) ? ans.join("\n") : String(ans));
  }

  // Ensure PDF contains the same data as JSON (plain text section)
  addHeading("Evidence JSON");
  const jsonText = JSON.stringify(evidence, null, 2);
  const jsonLines = doc.splitTextToSize(jsonText, maxW);
  jsonLines.forEach(line => { newPageIfNeeded(); doc.text(line, margin, y); y += lineH; });

  doc.save(`trident-report-${Date.now()}.pdf`);
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