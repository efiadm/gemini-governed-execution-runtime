#!/usr/bin/env node
/**
 * Trident Governance Audit Runner (Node Script)
 * 
 * Usage: node functions/audit-runner.js <evidence-file.json>
 * 
 * Reads exported evidence JSON and generates deterministic audit report.
 * Place exported evidence files in the same directory or provide full path.
 */

const fs = require('fs');

function generateAuditReport(evidenceJSON) {
  const report = {
    metadata: {
      generated_at: new Date().toISOString(),
      evidence_export_timestamp: evidenceJSON.export_timestamp,
      export_version: evidenceJSON.export_version,
    },
    summary: {
      total_runs: evidenceJSON.run_history?.length || 0,
      modes_tested: evidenceJSON.audit_metadata?.modes_tested || [],
      models_used: evidenceJSON.audit_metadata?.models_used || [],
      baseline_snapshots: Object.keys(evidenceJSON.baseline_snapshots || {}).length,
    },
    validation_analysis: analyzeValidation(evidenceJSON.run_history || []),
    performance_analysis: analyzePerformance(evidenceJSON.run_history || []),
    drift_analysis: analyzeDrift(evidenceJSON.run_history || []),
    compliance_score: calculateComplianceScore(evidenceJSON.run_history || []),
    recommendations: generateRecommendations(evidenceJSON),
  };
  
  return report;
}

function analyzeValidation(history) {
  const stats = {
    total_runs: history.length,
    passed: 0,
    failed: 0,
    safe_mode_activated: 0,
    total_repairs: 0,
    total_local_repairs: 0,
  };
  
  let repairAttempts = 0;
  let repairSuccesses = 0;
  
  history.forEach(run => {
    if (run.validation?.passed) {
      stats.passed++;
      if ((run.validation.repairs || 0) > 0) repairSuccesses++;
    } else stats.failed++;
    
    if (run.evidence?.safe_mode_applied) stats.safe_mode_activated++;
    stats.total_repairs += run.validation?.repairs || 0;
    stats.total_local_repairs += run.validation?.local_repairs || 0;
    if ((run.validation?.repairs || 0) > 0) repairAttempts++;
  });
  
  stats.avg_repairs = (stats.total_repairs / history.length).toFixed(2);
  stats.avg_local_repairs = (stats.total_local_repairs / history.length).toFixed(2);
  stats.repair_success_rate = repairAttempts > 0 ? ((repairSuccesses / repairAttempts) * 100).toFixed(1) + '%' : 'N/A';
  stats.pass_rate = ((stats.passed / history.length) * 100).toFixed(1) + '%';
  stats.safe_mode_rate = ((stats.safe_mode_activated / history.length) * 100).toFixed(1) + '%';
  
  return stats;
}

function analyzePerformance(history) {
  const stats = { total_latency: 0, model_latency: 0, local_latency: 0, count: 0 };
  
  history.forEach(run => {
    if (run.evidence) {
      stats.total_latency += run.evidence.latency_ms || 0;
      stats.model_latency += run.evidence.model_latency_ms || 0;
      stats.local_latency += run.evidence.local_latency_ms || 0;
      stats.count++;
    }
  });
  
  if (stats.count > 0) {
    stats.avg_latency_ms = Math.round(stats.total_latency / stats.count);
    stats.avg_model_ms = Math.round(stats.model_latency / stats.count);
    stats.avg_local_ms = Math.round(stats.local_latency / stats.count);
    stats.billable_pct = ((stats.avg_model_ms / stats.avg_latency_ms) * 100).toFixed(1) + '%';
  }
  
  return stats;
}

function analyzeDrift(history) {
  const analysis = {
    runs_with_drift: 0,
    stability_issues: 0,
    authority_drift: 0,
    citation_issues: 0,
    flags: {},
  };
  
  history.forEach(run => {
    if (run.drift) {
      analysis.runs_with_drift++;
      if (run.drift.stability_score < 70) analysis.stability_issues++;
      if (run.drift.authority_flags?.length > 0) {
        analysis.authority_drift++;
        run.drift.authority_flags.forEach(f => {
          analysis.flags[f] = (analysis.flags[f] || 0) + 1;
        });
      }
    }
    if (run.hallucination?.citation_integrity?.score < 80) analysis.citation_issues++;
  });
  
  return analysis;
}

function calculateComplianceScore(history) {
  if (history.length === 0) return 0;
  
  let score = 100;
  const val = analyzeValidation(history);
  
  score -= (100 - parseFloat(val.pass_rate)) * 0.5;
  if (parseFloat(val.safe_mode_rate) > 30) score -= (parseFloat(val.safe_mode_rate) - 30) * 0.5;
  if (parseFloat(val.avg_repairs) < 0.5) score += 5;
  
  return Math.max(0, Math.min(100, Math.round(score)));
}

function generateRecommendations(evidence) {
  const recs = [];
  const val = analyzeValidation(evidence.run_history || []);
  const perf = analyzePerformance(evidence.run_history || []);
  const drift = analyzeDrift(evidence.run_history || []);
  
  if (parseFloat(val.safe_mode_rate) > 30) {
    recs.push({ severity: 'high', message: `High safe mode rate (${val.safe_mode_rate}). Simplify prompts or adjust governance.` });
  }
  
  if (parseFloat(val.avg_repairs) > 1.5) {
    recs.push({ severity: 'medium', message: `High model repairs (${val.avg_repairs} avg). Enable local repair.` });
  }
  
  if (drift.authority_drift > evidence.run_history.length * 0.2) {
    recs.push({ severity: 'high', message: `Authority drift in ${drift.authority_drift} runs. Strengthen contract enforcement.` });
  }
  
  return recs;
}

// CLI Execution
if (require.main === module) {
  const file = process.argv[2];
  if (!file) {
    console.error('Usage: node audit-runner.js <evidence.json>');
    process.exit(1);
  }
  
  if (!fs.existsSync(file)) {
    console.error(`File not found: ${file}`);
    process.exit(1);
  }
  
  const evidence = JSON.parse(fs.readFileSync(file, 'utf8'));
  const report = generateAuditReport(evidence);
  
  const outFile = file.replace(/\.json$/, '-audit.json');
  fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
  
  console.log('\n=== TRIDENT AUDIT REPORT ===\n');
  console.log(`Runs: ${report.summary.total_runs}`);
  console.log(`Pass Rate: ${report.validation_analysis.pass_rate}`);
  console.log(`Safe Mode: ${report.validation_analysis.safe_mode_rate}`);
  console.log(`Avg Latency: ${report.performance_analysis.avg_latency_ms}ms`);
  console.log(`Compliance: ${report.compliance_score}/100\n`);
  
  if (report.recommendations.length > 0) {
    console.log('Recommendations:');
    report.recommendations.forEach((r, i) => {
      console.log(`  ${i + 1}. [${r.severity.toUpperCase()}] ${r.message}`);
    });
  }
  
  console.log(`\nReport: ${outFile}\n`);
}

module.exports = { generateAuditReport };