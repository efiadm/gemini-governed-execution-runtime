// Global run state store - single source of truth for all run data
let currentRunState = {
  run_id: null,
  timestamp: null,
  mode: null,
  grounding: null,
  model: null,
  prompt_text: null,
  rendered_output: null,
  parsed_output: null,
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
};

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
    rendered_output: null,
    parsed_output: null,
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