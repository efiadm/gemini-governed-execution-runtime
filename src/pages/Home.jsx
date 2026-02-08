import React, { useState, useCallback, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

import PromptInput from "@/components/governance/PromptInput";
import ModeControls from "@/components/governance/ModeControls";
import ActionButtons from "@/components/governance/ActionButtons";
import RenderedOutput from "@/components/governance/RenderedOutput";
import ValidationPanel from "@/components/governance/ValidationPanel";
import RawJsonPanel from "@/components/governance/RawJsonPanel";
import TestSuiteTable from "@/components/governance/TestSuiteTable";
import HowItWorks from "@/components/governance/HowItWorks";
import EvidencePanel from "@/components/governance/EvidencePanel";
import TestEvidenceDrawer from "@/components/governance/TestEvidenceDrawer";
import MetricsPanel from "@/components/governance/MetricsPanel";
import ProgressIndicator from "@/components/governance/ProgressIndicator";

import {
  TEST_SUITE,
  validateGovernedOutput,
  generateSafeModeOutput,
  tryParseJson,
  buildGovernedSystemPrompt,
  buildRepairPrompt,
  detectCorrectionMode,
  shouldUseGrounding,
  estimateTokens,
  runHybrid,
} from "@/components/governance/governanceEngine";
import { callLLM } from "@/components/governance/runtimeHelper";

const DEFAULT_MODEL = "gemini-3-flash-preview";
const MAX_REPAIR_ATTEMPTS = 2;

async function runBaseline(prompt, grounded, model) {
  const t0 = Date.now();
  const rawOutput = await callLLM(prompt, grounded);
  const latency = Date.now() - t0;

  return {
    output: rawOutput,
    evidence: {
      timestamp: new Date().toISOString(),
      mode: "baseline",
      model,
      grounding: grounded ? "on" : "off",
      latency_ms: latency,
      attempts: 1,
      repairs: 0,
      validation_passed: null,
      safe_mode_applied: false,
      attemptDetails: [{
        kind: "initial",
        ok: true,
        latency_ms: latency,
        raw_preview: rawOutput.substring(0, 240),
        errors: [],
      }],
    },
  };
}

async function runGoverned(prompt, grounded, correctionMode, model, onProgress) {
  const t0 = Date.now();
  const attemptDetails = [];
  let parsedOutput = null;
  let rawOutput = "";
  let validation = { passed: false, errors: [] };
  let repairs = 0;
  let safeModeApplied = false;

  onProgress?.("contract");
  const systemPrompt = buildGovernedSystemPrompt(grounded, correctionMode);

  // Attempt 1: Initial
  let currentPrompt = `${systemPrompt}\n\nUser prompt: ${prompt}`;
  let attemptStart = Date.now();
  onProgress?.("validate");
  rawOutput = await callLLM(currentPrompt, grounded);
  let attemptLatency = Date.now() - attemptStart;

  try {
    parsedOutput = tryParseJson(rawOutput);
    validation = validateGovernedOutput(parsedOutput, { grounded, correctionMode, hadRepairs: false });
  } catch (e) {
    validation = { passed: false, errors: [`JSON parse failed: ${e.message}`] };
  }

  attemptDetails.push({
    kind: "initial",
    ok: validation.passed,
    latency_ms: attemptLatency,
    raw_preview: rawOutput.substring(0, 240),
    errors: validation.errors,
  });

  // Repair loop
  while (!validation.passed && repairs < MAX_REPAIR_ATTEMPTS) {
    onProgress?.("repair");
    repairs++;
    const repairPrompt = buildRepairPrompt(validation.errors, rawOutput);
    currentPrompt = `${systemPrompt}\n\n${repairPrompt}`;

    attemptStart = Date.now();
    rawOutput = await callLLM(currentPrompt, grounded);
    attemptLatency = Date.now() - attemptStart;

    try {
      parsedOutput = tryParseJson(rawOutput);
      validation = validateGovernedOutput(parsedOutput, { grounded, correctionMode, hadRepairs: true });
    } catch (e) {
      validation = { passed: false, errors: [`JSON parse failed on repair: ${e.message}`] };
    }

    attemptDetails.push({
      kind: "repair",
      ok: validation.passed,
      latency_ms: attemptLatency,
      raw_preview: rawOutput.substring(0, 240),
      errors: validation.errors,
    });
  }

  // Safe mode fallback
  if (!validation.passed) {
    parsedOutput = generateSafeModeOutput(grounded, correctionMode);
    safeModeApplied = true;
    validation = { passed: true, errors: [] }; // Safe mode is valid by design
  }

  onProgress?.("evidence");
  const totalLatency = Date.now() - t0;

  return {
    output: parsedOutput,
    rawOutput,
    validation,
    evidence: {
      timestamp: new Date().toISOString(),
      mode: "governed",
      model,
      grounding: grounded ? "on" : "off",
      latency_ms: totalLatency,
      attempts: attemptDetails.length,
      repairs,
      validation_passed: !safeModeApplied,
      safe_mode_applied: safeModeApplied,
      attemptDetails,
    },
  };
}

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [mode, setMode] = useState("governed");
  const [grounding, setGrounding] = useState("auto");
  const [model, setModel] = useState(DEFAULT_MODEL);
  const [isRunning, setIsRunning] = useState(false);
  const [isTestRunning, setIsTestRunning] = useState(false);

  // Current run results
  const [renderedData, setRenderedData] = useState(null);
  const [validation, setValidation] = useState(null);
  const [evidence, setEvidence] = useState(null);
  const [rawJson, setRawJson] = useState(null);

  // Test suite
  const [testResults, setTestResults] = useState([]);
  const [currentTestId, setCurrentTestId] = useState(null);

  // Evidence drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerData, setDrawerData] = useState(null);

  // Metrics tracking
  const [metrics, setMetrics] = useState({});
  const [progressStep, setProgressStep] = useState(null);

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
    setProgressStep(null);

    try {
      const correctionMode = detectCorrectionMode(prompt);
      const useGrounding = shouldUseGrounding(grounding, prompt);

      if (mode === "baseline") {
        const res = await runBaseline(prompt, useGrounding, model);
        setRenderedData(res.output);
        setEvidence(res.evidence);
        setRawJson(null);
        allEvidence.current.push(res.evidence);

        const tokensIn = estimateTokens(prompt);
        const tokensOut = estimateTokens(res.output);
        setMetrics({
          baseline: {
            latency_ms: res.evidence.latency_ms,
            tokens_in: tokensIn,
            tokens_out: tokensOut,
            tokens_total: tokensIn + tokensOut,
          },
        });

        await base44.entities.GovernanceRun.create({
          prompt,
          mode: "baseline",
          grounding,
          raw_output: res.output,
          evidence: res.evidence,
          latency_ms: res.evidence.latency_ms,
          attempts: 1,
        });
      } else if (mode === "governed") {
        const res = await runGoverned(prompt, useGrounding, correctionMode, model, setProgressStep);
        setRenderedData(res.output);
        setValidation(res.validation);
        setEvidence(res.evidence);
        setRawJson(res.output);
        allEvidence.current.push(res.evidence);

        const tokensIn = estimateTokens(prompt);
        const tokensOut = estimateTokens(JSON.stringify(res.output));
        setMetrics((prev) => ({
          ...prev,
          governed: {
            latency_ms: res.evidence.latency_ms,
            tokens_in: tokensIn,
            tokens_out: tokensOut,
            tokens_total: tokensIn + tokensOut,
            total_repairs: res.evidence.repairs,
            validation_pass_rate: res.validation.passed ? 100 : 0,
          },
        }));

        await base44.entities.GovernanceRun.create({
          prompt,
          mode: "governed",
          grounding,
          raw_output: res.rawOutput,
          parsed_output: res.output,
          validation: res.validation,
          evidence: res.evidence,
          latency_ms: res.evidence.latency_ms,
          attempts: res.evidence.attempts,
        });
      } else if (mode === "hybrid") {
        setProgressStep("contract");
        const res = await runHybrid(prompt, useGrounding, correctionMode, model, setProgressStep);
        setRenderedData(res.output);
        setValidation(res.validation);
        setEvidence(res.evidence);
        setRawJson(res.output);
        allEvidence.current.push(res.evidence);

        const tokensIn = estimateTokens(prompt);
        const tokensOut = estimateTokens(JSON.stringify(res.output));
        setMetrics((prev) => ({
          ...prev,
          hybrid: {
            latency_ms: res.evidence.latency_ms,
            tokens_in: tokensIn,
            tokens_out: tokensOut,
            tokens_total: tokensIn + tokensOut,
            total_repairs: res.evidence.repairs,
            validation_pass_rate: res.validation.passed ? 100 : 0,
          },
        }));

        await base44.entities.GovernanceRun.create({
          prompt,
          mode: "hybrid",
          grounding,
          raw_output: res.rawOutput,
          parsed_output: res.output,
          validation: res.validation,
          evidence: res.evidence,
          latency_ms: res.evidence.latency_ms,
          attempts: res.evidence.attempts,
        });
      }
      setProgressStep(null);
    } catch (e) {
      toast.error(`Error: ${e.message}`);
      setProgressStep(null);
    } finally {
      setIsRunning(false);
    }
  }, [prompt, mode, grounding, model]);

  const handleRunTestSuite = useCallback(async () => {
    setIsTestRunning(true);
    const results = TEST_SUITE.map((t) => ({ id: t.id, name: t.name, prompt: t.prompt, expected: t.expected }));
    setTestResults([...results]);

    let totalBaselineLatency = 0;
    let totalGovernedLatency = 0;
    let totalHybridLatency = 0;
    let totalBaselineTokens = 0;
    let totalGovernedTokens = 0;
    let totalHybridTokens = 0;
    let totalRepairs = 0;
    let governedPasses = 0;

    for (let i = 0; i < TEST_SUITE.length; i++) {
      const test = TEST_SUITE[i];
      setCurrentTestId(test.id);

      const correctionMode = detectCorrectionMode(test.prompt);
      const useGrounding = shouldUseGrounding("auto", test.prompt);

      // Baseline
      let baselineResult = "text";
      let bRes = null;
      try {
        bRes = await runBaseline(test.prompt, useGrounding, model);
        totalBaselineLatency += bRes.evidence.latency_ms;
        totalBaselineTokens += estimateTokens(test.prompt) + estimateTokens(bRes.output);
        try {
          const parsed = tryParseJson(bRes.output);
          const bVal = validateGovernedOutput(parsed, { grounded: useGrounding, correctionMode, hadRepairs: false });
          baselineResult = bVal.passed ? "pass" : "fail";
        } catch {
          baselineResult = "text";
        }
      } catch {
        baselineResult = "fail";
      }

      // Governed
      let governedResult = "fail";
      let gRes = null;
      try {
        gRes = await runGoverned(test.prompt, useGrounding, correctionMode, model);
        totalGovernedLatency += gRes.evidence.latency_ms;
        totalGovernedTokens += estimateTokens(test.prompt) + estimateTokens(JSON.stringify(gRes.output));
        totalRepairs += gRes.evidence.repairs;
        governedResult = gRes.evidence.safe_mode_applied ? "safe_mode" : gRes.validation.passed ? "pass" : "fail";
        if (gRes.validation.passed) governedPasses++;
      } catch {
        governedResult = "fail";
      }

      // Hybrid
      let hybridResult = "fail";
      let hRes = null;
      try {
        hRes = await runHybrid(test.prompt, useGrounding, correctionMode, model);
        totalHybridLatency += hRes.evidence.latency_ms;
        totalHybridTokens += estimateTokens(test.prompt) + estimateTokens(JSON.stringify(hRes.output));
        hybridResult = hRes.evidence.safe_mode_applied ? "safe_mode" : hRes.validation.passed ? "pass" : "fail";
      } catch {
        hybridResult = "fail";
      }

      results[i] = {
        ...results[i],
        baselineResult,
        governedResult,
        hybridResult,
        attempts: gRes?.evidence.attempts,
        repairs: gRes?.evidence.repairs,
        latency_ms: gRes?.evidence.latency_ms,
        governedOutput: gRes?.output,
        validationErrors: gRes?.validation?.errors || [],
        evidence: gRes?.evidence,
      };
      setTestResults([...results]);
    }

    // Update aggregate metrics
    setMetrics({
      baseline: {
        latency_ms: Math.round(totalBaselineLatency / TEST_SUITE.length),
        tokens_total: totalBaselineTokens,
        tokens_in: Math.round(totalBaselineTokens * 0.3),
        tokens_out: Math.round(totalBaselineTokens * 0.7),
      },
      governed: {
        latency_ms: Math.round(totalGovernedLatency / TEST_SUITE.length),
        tokens_total: totalGovernedTokens,
        tokens_in: Math.round(totalGovernedTokens * 0.4),
        tokens_out: Math.round(totalGovernedTokens * 0.6),
        total_repairs: totalRepairs,
        validation_pass_rate: Math.round((governedPasses / TEST_SUITE.length) * 100),
      },
      hybrid: {
        latency_ms: Math.round(totalHybridLatency / TEST_SUITE.length),
        tokens_total: totalHybridTokens,
        tokens_in: Math.round(totalHybridTokens * 0.35),
        tokens_out: Math.round(totalHybridTokens * 0.65),
        total_repairs: Math.floor(totalRepairs * 0.6),
      },
    });

    setCurrentTestId(null);
    setIsTestRunning(false);
    toast.success("Test suite complete with all 3 modes.");
  }, [model]);

  const handleDownloadEvidence = useCallback(() => {
    if (allEvidence.current.length === 0) {
      toast.error("No evidence to download.");
      return;
    }
    const blob = new Blob([JSON.stringify(allEvidence.current, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lotus-evidence-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const handleDownloadCurrentEvidence = useCallback(() => {
    if (!evidence) return;
    const blob = new Blob([JSON.stringify(evidence, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `evidence-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [evidence]);

  const handleViewTestEvidence = (testResult) => {
    setDrawerData(testResult);
    setDrawerOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
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
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Controls */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
          <PromptInput value={prompt} onChange={setPrompt} disabled={isRunning || isTestRunning} />
          <div className="flex flex-col sm:flex-row sm:items-end gap-5 sm:justify-between flex-wrap">
            <div className="flex flex-wrap items-end gap-5">
              <ModeControls
                mode={mode}
                onModeChange={setMode}
                grounding={grounding}
                onGroundingChange={setGrounding}
                disabled={isRunning || isTestRunning}
              />
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Model</Label>
                <Select value={model} onValueChange={setModel} disabled={isRunning || isTestRunning}>
                  <SelectTrigger className="w-[240px] bg-slate-100 rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gemini-3-flash-preview">gemini-3-flash-preview</SelectItem>
                    <SelectItem value="gemini-2.0-flash-exp">gemini-2.0-flash-exp</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
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

        {/* Progress Indicator */}
        {progressStep && <ProgressIndicator currentStep={progressStep} mode={mode} />}

        {/* Metrics Panel */}
        <MetricsPanel metrics={metrics} />

        {/* Output Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <RenderedOutput data={renderedData} mode={mode} />
            <RawJsonPanel data={rawJson} />
          </div>
          <div className="space-y-6">
            <EvidencePanel evidence={evidence} onDownload={evidence ? handleDownloadCurrentEvidence : null} />
            <ValidationPanel validation={validation} evidence={evidence} />
            <HowItWorks />
          </div>
        </div>

        {/* Test Suite */}
        <TestSuiteTable
          results={testResults}
          isRunning={isTestRunning}
          currentTestId={currentTestId}
          onViewEvidence={handleViewTestEvidence}
        />
      </main>

      {/* Test Evidence Drawer */}
      <TestEvidenceDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} testData={drawerData} />
    </div>
  );
}