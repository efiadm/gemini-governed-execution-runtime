/**
 * Global run state store - Execution + Audit separation
 * 
 * RunMeta: run_id, created_at, prompt_hash, prompt_preview, model, grounding, lanes_run[]
 * LaneResult: per lane (baseline/governed/hybrid)
 *   - execution_metrics (BILLABLE ONLY): tokens, model latency, repair metrics
 *   - runtime_local_metrics (NON-BILLABLE): validation, render, evidence assembly
 *   - audit_metrics (SEPARATE): audit model calls/tokens/latency
 */
let currentRunState = {
  // RunMeta
  run_id: null,
  created_at: null,
  prompt_hash: null,
  prompt_text: null,
  prompt_preview: null,
  model: null,
  grounding: null,
  lanes_run: [], // ['baseline', 'governed', 'hybrid']
  
  // Active lane result (currently displayed)
  active_lane: null,
  
  // Lane results keyed by lane name
  lane_results: {
    baseline: null,
    governed: null,
    hybrid: null,
  },
  
  // Legacy fields for compatibility
  mode: null,
  timestamp: null,
  rendered_output: null,
  parsed_output: null,
  raw_output: null,
  validation: {
    passed: null,
    attempts: 0,
    repairs: 0,
    local_repairs: 0,
    errors: [],
  },
  evidence: null,
  
  // Runtime artifacts (append-only)
  artifacts: [],
  attempt_history: [],
  
  // Drift/Hallucination (computed after execution)
  drift: null,
  hallucination: null,
  
  // Test results
  tests: [],
};

// Store last N=25 RunRecords in memory
let runHistory = [];

// Baseline snapshots keyed by (prompt_hash, model, grounding)
let baselineSnapshots = {};

const listeners = [];

export function getRunState() {
  return { ...currentRunState };
}

export function updateRunState(updates) {
  currentRunState = { ...currentRunState, ...updates };
  notifyListeners();
}

export function resetRunState() {
  currentRunState = {
    run_id: null,
    created_at: null,
    prompt_hash: null,
    prompt_text: null,
    prompt_preview: null,
    model: null,
    grounding: null,
    lanes_run: [],
    active_lane: null,
    lane_results: {
      baseline: null,
      governed: null,
      hybrid: null,
    },
    mode: null,
    timestamp: null,
    rendered_output: null,
    parsed_output: null,
    raw_output: null,
    validation: {
      passed: null,
      attempts: 0,
      repairs: 0,
      local_repairs: 0,
      errors: [],
    },
    evidence: null,
    artifacts: [],
    attempt_history: [],
    drift: null,
    hallucination: null,
    tests: [],
  };
  notifyListeners();
}

export function subscribeToRunState(callback) {
  listeners.push(callback);
  return () => {
    const index = listeners.indexOf(callback);
    if (index > -1) listeners.splice(index, 1);
  };
}

function notifyListeners() {
  listeners.forEach(cb => cb(currentRunState));
}

export function addAttempt(attempt) {
  currentRunState.attempt_history.push(attempt);
  notifyListeners();
}

export function addArtifact(artifact) {
  currentRunState.artifacts.push(artifact);
  notifyListeners();
}

export function setTestResults(results) {
  currentRunState.tests = results;
  notifyListeners();
}

export function getRunHistory() {
  return [...runHistory];
}

export function addToRunHistory(record) {
  runHistory.push(record);
  if (runHistory.length > 25) {
    runHistory.shift();
  }
  
  // Store baseline_metrics artifact for delta comparison
  if (record.mode === "baseline") {
    const key = `${record.prompt_hash}_${record.model}_${record.grounding}`;
    const baselineMetrics = record.artifacts?.find(a => a.type === "baseline_metrics") || {};
    baselineSnapshots[key] = {
      execution_metrics: {
        model_latency_ms: baselineMetrics.model_latency_ms,
        prompt_tokens: baselineMetrics.prompt_tokens,
        completion_tokens: baselineMetrics.completion_tokens,
        total_tokens: baselineMetrics.total_tokens,
      },
      timestamp: record.timestamp,
    };
  }
}

export function getBaselineSnapshot(promptHash, model, grounding) {
  const key = `${promptHash}_${model}_${grounding}`;
  return baselineSnapshots[key] || null;
}

export function hasBaselineSnapshot(promptHash, model, grounding) {
  const key = `${promptHash}_${model}_${grounding}`;
  return !!baselineSnapshots[key];
}

/**
 * Store lane result with execution/audit separation
 */
export function setLaneResult(lane, result) {
  currentRunState.lane_results[lane] = result;
  currentRunState.active_lane = lane;
  
  // Update legacy fields for compatibility
  currentRunState.mode = lane;
  currentRunState.rendered_output = result.output_rendered;
  currentRunState.parsed_output = result.output_parsed;
  currentRunState.raw_output = result.output_raw;
  currentRunState.validation = result.validation;
  currentRunState.evidence = result.evidence;
  
  notifyListeners();
}

export function getLaneResult(lane) {
  return currentRunState.lane_results[lane];
}

export function getActiveLaneResult() {
  return currentRunState.lane_results[currentRunState.active_lane];
}