// Global run state store - single source of truth for all run data
let currentRunState = {
  run_id: null,
  timestamp: null,
  mode: null,
  grounding: null,
  model: null,
  prompt_text: null,
  prompt_hash: null,
  rendered_output: null,
  parsed_output: null,
  parsedOutputText: null,
  governedJson: null,
  validation: {
    passed: null,
    attempts: 0,
    repairs: 0,
    local_repairs: 0,
    errors: [],
  },
  performance: {
    billable: {},
    local: {},
    total: {},
  },
  artifacts: [],
  tests: [],
  attempt_history: [],
  raw_output: null,
  drift: null,
  hallucination: null,
  evidence: null,
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
    timestamp: null,
    mode: null,
    grounding: null,
    model: null,
    prompt_text: null,
    prompt_hash: null,
    rendered_output: null,
    parsed_output: null,
    parsedOutputText: null,
    governedJson: null,
    validation: {
      passed: null,
      attempts: 0,
      repairs: 0,
      errors: [],
    },
    performance: {
      billable: {},
      app_runtime: {},
      total: {},
    },
    artifacts: [],
    tests: [],
    attempt_history: [],
    raw_output: null,
    drift: null,
    hallucination: null,
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