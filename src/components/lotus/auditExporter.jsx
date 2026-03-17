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
  const cur = evidence?.current_run || {};
  const ev = cur?.evidence || {};

  const validationPassed = ((ev?.validation_passed ?? cur?.validation?.passed) === true);
  const resultText = validationPassed ? "PASS" : "FAIL";

  const validationLabel = validationPassed ? "Passed" : "Failed";
  const safeModeLabel = ev?.safe_mode_applied ? "Yes" : "No";
  const attempts = ev?.attempts ?? (cur?.attempt_history?.length ?? "-");
  const repairs = ev?.repairs ?? cur?.validation?.repairs ?? "-";
  const latency = (ev?.latency_ms != null) ? `${ev.latency_ms} ms` : "-";

  const failureReason = (
    cur?.validation?.failures?.[0]?.reason ||
    cur?.validation?.failures?.[0]?.message ||
    cur?.validation?.message ||
    ev?.validation_failure_reason ||
    "None"
  );

  let hallucinationText = "N/A";
  const h = cur?.hallucination;
  if (h?.risk_level) {
    hallucinationText = String(h.risk_level);
  } else if (typeof h?.score === "number") {
    hallucinationText = h.score >= 80 ? "Low" : h.score >= 50 ? "Medium" : "High";
  } else if (typeof h?.citation_integrity?.score === "number") {
    const s = h.citation_integrity.score;
    hallucinationText = s >= 80 ? "Low" : s >= 60 ? "Medium" : "High";
  }

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

  // Title
  addHeading("AI Behavior Test Report");
  addText(`Result: ${resultText}`);

  // Summary
  addHeading("Summary");
  addText(`Validation: ${validationLabel}`);
  addText(`Safe Mode: ${safeModeLabel}`);
  addText(`Attempts: ${attempts}`);
  addText(`Repairs: ${repairs}`);
  addText(`Latency: ${latency}`);

  // Issues
  addHeading("Issues");
  addText(`- ${failureReason}`);

  // Risk
  addHeading("Risk");
  addText(`Hallucination: ${hallucinationText}`);

  // What Happened
  addHeading("What Happened");
  const bullets = [
    `- Mode: ${cur?.mode ?? "-"} • Model: ${cur?.model ?? "-"} • Grounding: ${cur?.grounding ?? "-"}`,
    `- Validation ${validationPassed ? "passed" : "failed"}; Safe Mode ${ev?.safe_mode_applied ? "on" : "off"}; Attempts ${attempts}; Repairs ${repairs}.`,
    `- Latency ${latency}`,
  ];
  bullets.forEach(line => addText(line));

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