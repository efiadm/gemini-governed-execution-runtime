import React, { useState, useCallback, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

import PromptInput from "@/components/governance/PromptInput";
import ModeControls from "@/components/governance/ModeControls";
import ActionButtons from "@/components/governance/ActionButtons";
import RenderedOutput from "@/components/governance/RenderedOutput";
import ValidationPanel from "@/components/governance/ValidationPanel";
import RawJsonPanel from "@/components/governance/RawJsonPanel";
import TestSuiteTable from "@/components/governance/TestSuiteTable";
import HowItWorks from "@/components/governance/HowItWorks";

import {
  GOVERNED_SYSTEM_PROMPT,
  REPAIR_PROMPT_PREFIX,
  REPAIR_PROMPT_SUFFIX,
  TEST_SUITE,
  validateGovernanceOutput,
  generateSafeModeJson,
  tryParseJson,
} from "@/components/governance/governanceEngine";

const MODEL_NAME = "gemini-3-flash-preview";

async function callLLM(prompt, grounding, useGovernance) {
  const fullPrompt = useGovernance
    ? `${GOVERNED_SYSTEM_PROMPT}\n\nUser prompt: ${prompt}`
    : prompt;

  const shouldGround = grounding === "on" || (grounding === "auto" && /source|cite|reference|url|link|cloudflare|error 524/i.test(prompt));

  const result = await base44.integrations.Core.InvokeLLM({
    prompt: fullPrompt,
    add_context_from_internet: shouldGround,
  });

  return { result, grounded: shouldGround };
}

async function runGoverned(prompt, grounding, isCorrectionMode) {
  const startTime = Date.now();
  let attempts = 0;
  let repairs = 0;
  let lastValidation = null;
  let parsedOutput = null;
  let safeModeApplied = false;
  let rawOutput = "";

  // Attempt 1
  attempts++;
  const { result, grounded } = await callLLM(prompt, grounding, true);
  rawOutput = typeof result === "string" ? result : JSON.stringify(result);

  try {
    parsedOutput = typeof result === "object" ? result : tryParseJson(rawOutput);
    lastValidation = validateGovernanceOutput(parsedOutput, grounding, isCorrectionMode);
  } catch {
    lastValidation = { passed: false, errors: ["JSON parse failed"], errorCount: 1 };
  }

  // Repair loop (max 2)
  while (!lastValidation.passed && repairs < 2) {
    repairs++;
    attempts++;
    const repairPrompt = `${GOVERNED_SYSTEM_PROMPT}\n\nOriginal user prompt: ${prompt}\n\n${REPAIR_PROMPT_PREFIX}${JSON.stringify(lastValidation.errors, null, 2)}\n\nPrevious (invalid) output:\n${rawOutput}${REPAIR_PROMPT_SUFFIX}`;

    const repairResult = await base44.integrations.Core.InvokeLLM({
      prompt: repairPrompt,
      add_context_from_internet: grounded,
    });

    const repairRaw = typeof repairResult === "string" ? repairResult : JSON.stringify(repairResult);
    rawOutput = repairRaw;

    try {
      parsedOutput = typeof repairResult === "object" ? repairResult : tryParseJson(repairRaw);
      lastValidation = validateGovernanceOutput(parsedOutput, grounding, isCorrectionMode);
    } catch {
      lastValidation = { passed: false, errors: ["JSON parse failed on repair attempt"], errorCount: 1 };
    }
  }

  // Safe mode fallback
  if (!lastValidation.passed) {
    parsedOutput = generateSafeModeJson(prompt);
    safeModeApplied = true;
    lastValidation = validateGovernanceOutput(parsedOutput, grounding, false);
  }

  const latency = Date.now() - startTime;

  const evidence = {
    timestamp: new Date().toISOString(),
    model: MODEL_NAME,
    mode: "governed",
    grounding: grounded ? "on" : "off",
    latency_ms: latency,
    attempts,
    repairs,
    safe_mode_applied: safeModeApplied,
    validation_passed: lastValidation.passed,
    prompt,
  };

  return { parsedOutput, rawOutput, validation: lastValidation, evidence };
}

async function runBaseline(prompt, grounding) {
  const startTime = Date.now();
  const { result, grounded } = await callLLM(prompt, grounding, false);
  const latency = Date.now() - startTime;
  const raw = typeof result === "string" ? result : JSON.stringify(result, null, 2);

  const evidence = {
    timestamp: new Date().toISOString(),
    model: MODEL_NAME,
    mode: "baseline",
    grounding: grounded ? "on" : "off",
    latency_ms: latency,
    attempts: 1,
    repairs: 0,
    safe_mode_applied: false,
    validation_passed: null,
    prompt,
  };

  return { output: raw, evidence };
}

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [mode, setMode] = useState("governed");
  const [grounding, setGrounding] = useState("auto");
  const [isRunning, setIsRunning] = useState(false);
  const [isTestRunning, setIsTestRunning] = useState(false);

  // Results state
  const [renderedData, setRenderedData] = useState(null);
  const [validation, setValidation] = useState(null);
  const [evidence, setEvidence] = useState(null);
  const [rawJson, setRawJson] = useState(null);

  // Test suite state
  const [testResults, setTestResults] = useState([]);
  const [currentTestId, setCurrentTestId] = useState(null);

  // Evidence collection
  const allEvidence = useRef([]);

  const handleRun = useCallback(async () => {
    if (!prompt.trim()) {
      toast.error("Enter a prompt first.");
      return;
    }
    setIsRunning(true);
    setRenderedData(null);
    setValidation(null);
    setEvidence(null);
    setRawJson(null);

    const startTime = Date.now();

    if (mode === "governed") {
      const isCorrectionMode = /wrong|fix|correct|mistake/i.test(prompt);
      const res = await runGoverned(prompt, grounding, isCorrectionMode);
      setRenderedData(res.parsedOutput);
      setValidation(res.validation);
      setEvidence(res.evidence);
      setRawJson(res.parsedOutput);
      allEvidence.current.push(res.evidence);

      await base44.entities.GovernanceRun.create({
        prompt,
        mode: "governed",
        grounding,
        raw_output: res.rawOutput,
        parsed_output: res.parsedOutput,
        validation: res.validation,
        evidence: res.evidence,
        latency_ms: res.evidence.latency_ms,
        attempts: res.evidence.attempts,
      });
    } else {
      const res = await runBaseline(prompt, grounding);
      setRenderedData(res.output);
      setValidation(null);
      setEvidence(res.evidence);
      setRawJson(null);
      allEvidence.current.push(res.evidence);

      await base44.entities.GovernanceRun.create({
        prompt,
        mode: "baseline",
        grounding,
        raw_output: res.output,
        evidence: res.evidence,
        latency_ms: res.evidence.latency_ms,
        attempts: 1,
      });
    }

    setIsRunning(false);
  }, [prompt, mode, grounding]);

  const handleRunTestSuite = useCallback(async () => {
    setIsTestRunning(true);
    const results = TEST_SUITE.map((t) => ({
      id: t.id,
      name: t.name,
    }));
    setTestResults([...results]);

    for (let i = 0; i < TEST_SUITE.length; i++) {
      const test = TEST_SUITE[i];
      setCurrentTestId(test.id);

      // Run baseline
      let baselineResult = "text";
      try {
        const bRes = await runBaseline(test.prompt, "auto");
        allEvidence.current.push({ ...bRes.evidence, test_id: test.id });

        // Try to validate baseline against contract
        try {
          const parsed = tryParseJson(bRes.output);
          const bVal = validateGovernanceOutput(parsed, "auto", test.isCorrectionMode);
          baselineResult = bVal.passed ? "pass" : "fail";
        } catch {
          baselineResult = "text"; // not even JSON
        }
      } catch {
        baselineResult = "fail";
      }

      // Run governed
      let governedResult = "fail";
      let attempts = 1;
      let repairs = 0;
      let latency_ms = 0;
      try {
        const gRes = await runGoverned(test.prompt, "auto", test.isCorrectionMode);
        governedResult = gRes.validation.passed
          ? gRes.evidence.safe_mode_applied
            ? "safe_mode"
            : "pass"
          : "fail";
        attempts = gRes.evidence.attempts;
        repairs = gRes.evidence.repairs;
        latency_ms = gRes.evidence.latency_ms;
        allEvidence.current.push({ ...gRes.evidence, test_id: test.id });
      } catch {
        governedResult = "fail";
      }

      results[i] = {
        ...results[i],
        baselineResult,
        governedResult,
        attempts,
        repairs,
        latency_ms,
      };
      setTestResults([...results]);
    }

    setCurrentTestId(null);
    setIsTestRunning(false);
    toast.success("Test suite complete.");
  }, []);

  const handleDownloadEvidence = useCallback(() => {
    if (allEvidence.current.length === 0) {
      toast.error("No evidence to download.");
      return;
    }
    const blob = new Blob([JSON.stringify(allEvidence.current, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `governance-evidence-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-200">
              <span className="text-white text-xs font-bold">LG</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">Lotus Governed Runner</h1>
              <p className="text-[11px] text-slate-400 tracking-wide">
                Contract → Validate → Repair → Evidence
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">
              Model
            </span>
            <span className="text-xs font-mono text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
              {MODEL_NAME}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Controls Section */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
          <PromptInput value={prompt} onChange={setPrompt} disabled={isRunning || isTestRunning} />
          <div className="flex flex-col sm:flex-row sm:items-end gap-5 sm:justify-between">
            <ModeControls
              mode={mode}
              onModeChange={setMode}
              grounding={grounding}
              onGroundingChange={setGrounding}
              disabled={isRunning || isTestRunning}
            />
            <ActionButtons
              onRun={handleRun}
              onRunTestSuite={handleRunTestSuite}
              onDownloadEvidence={handleDownloadEvidence}
              isRunning={isRunning}
              isTestRunning={isTestRunning}
              hasEvidence={allEvidence.current.length > 0}
            />
          </div>
        </div>

        {/* Output Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <RenderedOutput data={renderedData} mode={mode} />
            <RawJsonPanel data={rawJson} />
          </div>
          <div className="space-y-6">
            <ValidationPanel validation={validation} evidence={evidence} />
            <HowItWorks />
          </div>
        </div>

        {/* Test Suite */}
        <TestSuiteTable
          results={testResults}
          isRunning={isTestRunning}
          currentTestId={currentTestId}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 mt-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex items-center justify-between">
          <p className="text-xs text-slate-400">
            Lotus Governed Runner — Runtime AI Governance Demo
          </p>
          <p className="text-xs text-slate-400">
            Contract → Validate → Repair → Evidence
          </p>
        </div>
      </footer>
    </div>
  );
}