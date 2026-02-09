import React, { useState, useCallback, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

import PromptPanel from "@/components/lotus/PromptPanel";
import OutputPanel from "@/components/lotus/OutputPanel";
import SummaryPanel from "@/components/lotus/SummaryPanel";
import EvidenceTab from "@/components/lotus/EvidenceTab";
import TestsTab from "@/components/lotus/TestsTab";
import PerformanceTab from "@/components/lotus/PerformanceTab";
import ArtifactsTab from "@/components/lotus/ArtifactsTab";
import DriftTab from "@/components/lotus/DriftTab";
import UnderTheHoodPanel from "@/components/lotus/UnderTheHoodPanel";
import TruncationWidget from "@/components/lotus/TruncationWidget";
import ProgressStepper from "@/components/lotus/ProgressStepper";
import SummaryTab from "@/components/lotus/SummaryTab";



import { runBaseline, runGoverned, runHybrid } from "@/components/lotus/runtimeEngine";
import { runAuditPipeline } from "@/components/lotus/auditPipeline";
import { getSettings } from "@/components/lotus/settingsStore";
import { TEST_SUITE, runTestSuite } from "@/components/lotus/testSuite";
import { calculateMetrics, calculateTruncationRisk } from "@/components/lotus/metricsEngine";
import { generateRequestId } from "@/components/lotus/utils";
import { getStoredModel, setStoredModel } from "@/components/lotus/modelsRegistry";
import { PRESET_PROMPTS } from "@/components/lotus/presets";
import { updateRunState, resetRunState, getRunState, addToRunHistory } from "@/components/lotus/runStore";
import { computeDriftTelemetry } from "@/components/lotus/driftEngine";
import { computeHallucinationTelemetry } from "@/components/lotus/hallucinationDetector";
import { hashPrompt } from "@/components/lotus/utils";



export default function Home() {
  const [mode, setMode] = useState("governed");
  const [grounding, setGrounding] = useState("auto");
  const [model, setModel] = useState(getStoredModel());
  const [prompt, setPrompt] = useState("");
  
  const [isRunning, setIsRunning] = useState(false);
  const [isTestRunning, setIsTestRunning] = useState(false);
  const [progressStep, setProgressStep] = useState(null);
  const [progressTimestamps, setProgressTimestamps] = useState({});
  
  const [currentOutput, setCurrentOutput] = useState(null);
  const [currentEvidence, setCurrentEvidence] = useState(null);
  const [allModeMetrics, setAllModeMetrics] = useState({});
  const [truncationRisk, setTruncationRisk] = useState(0);
  
  const [testResults, setTestResults] = useState([]);
  const [currentTestId, setCurrentTestId] = useState(null);
  
  const [activeTab, setActiveTab] = useState("summary");
  const [showTelemetry, setShowTelemetry] = useState(true);
  
  const baselineRef = useRef(null);
  const evidenceHistory = useRef([]);

  const handleModelChange = useCallback((newModel) => {
    setModel(newModel);
    setStoredModel(newModel);
  }, []);

  const handleRun = useCallback(async (overrideMode = null) => {
    if (!prompt.trim()) {
      toast.error("Enter a prompt first");
      return;
    }

    // Check if overrideMode is an event object (from button click)
    const runMode = (typeof overrideMode === 'string') ? overrideMode : mode;

    setIsRunning(true);
    setProgressStep(null);
    setProgressTimestamps({});
    
    if (!overrideMode) {
      setCurrentOutput(null);
      setCurrentEvidence(null);
    }

    const requestId = generateRequestId();
    const startTime = Date.now();

    try {
      let result;
      
      const onProgress = (step) => {
        setProgressStep(step);
        setProgressTimestamps(prev => ({ ...prev, [step]: Date.now() }));
      };

      const settings = getSettings();
      
      if (runMode === "baseline") {
        result = await runBaseline(prompt, grounding, model, onProgress);
      } else if (runMode === "governed") {
        result = await runGoverned(prompt, grounding, model, onProgress, settings);
      } else {
        result = await runHybrid(prompt, grounding, model, onProgress, settings);
      }
      
      // Execution complete - update UI immediately
      setCurrentOutput(result.output);
      setCurrentEvidence(result.evidence);

      const metrics = calculateMetrics(result.evidence, result.rawOutput, prompt, runMode);
      setAllModeMetrics(prev => ({ ...prev, [runMode]: metrics }));
      
      if (runMode === "baseline") {
        baselineRef.current = metrics;
      }
      
      const risk = calculateTruncationRisk(metrics.billable.total_model_tokens);
      setTruncationRisk(risk);
      
      evidenceHistory.current.push({
        requestId,
        timestamp: new Date().toISOString(),
        mode,
        grounding,
        model,
        prompt,
        evidence: result.evidence,
      });

      // Build normalized RunRecord
      const parsedOutputText = typeof result.rawOutput === "string" ? result.rawOutput : JSON.stringify(result.rawOutput);
      const governedJson = (typeof result.output === "object" && result.output !== null) ? result.output : null;
      const promptHash = hashPrompt(prompt);

      const runRecord = {
        run_id: requestId,
        timestamp: new Date().toISOString(),
        mode: runMode,
        grounding,
        model,
        prompt_text: prompt,
        prompt_hash: promptHash,
        parsedOutputText,
        governedJson,
        rendered_output: result.output,
        parsed_output: governedJson,
        raw_output: result.rawOutput,
        validation: {
          passed: result.evidence?.validation_passed ?? (runMode === "baseline" ? null : false),
          attempts: result.evidence?.attempts || 0,
          repairs: result.evidence?.repairs || 0,
          local_repairs: result.evidence?.local_repairs || 0,
          errors: result.evidence?.validation_summary?.failures || [],
        },
        performance: {
          baseline: baselineRef.current || {},
          [runMode]: metrics,
        },
        evidence: result.evidence,
        artifacts: getRunState().artifacts || [],
      };

      // Compute drift and hallucination telemetry
      const drift = computeDriftTelemetry(runRecord, evidenceHistory.current.map(h => h.evidence));
      const hallucination = computeHallucinationTelemetry(runRecord);

      runRecord.drift = drift;
      runRecord.hallucination = hallucination;

      // Add to history
      addToRunHistory(runRecord);

      // Update global run store
      updateRunState({
        ...runRecord,
        drift,
        hallucination,
      });

      await base44.entities.GovernanceRun.create({
        prompt,
        mode: runMode,
        grounding,
        raw_output: result.rawOutput,
        parsed_output: typeof result.output === "object" ? result.output : null,
        validation: result.validation,
        evidence: result.evidence,
        latency_ms: result.evidence?.latency_ms || Date.now() - startTime,
      });

      setProgressStep("complete");
      toast.success("Run complete");
    } catch (err) {
      console.error("Run error:", err);
      toast.error(`Error: ${err.message}`);
      setCurrentEvidence({
        error: true,
        error_message: err.message,
        error_code: err.code || "UNKNOWN",
        timestamp: new Date().toISOString(),
      });
    } finally {
      setIsRunning(false);
      setTimeout(() => setProgressStep(null), 2000);
    }
  }, [prompt, mode, grounding, model]);



  const handleRunTestSuite = useCallback(async () => {
    setIsTestRunning(true);
    setActiveTab("tests");
    
    try {
      const results = await runTestSuite(
        model,
        grounding,
        (testId) => setCurrentTestId(testId),
        (results) => setTestResults([...results])
      );
      
      setTestResults(results);
      
      const allMetrics = { baseline: {}, governed: {}, hybrid: {} };
      results.forEach(r => {
        ["baseline", "governed", "hybrid"].forEach(m => {
          if (r[`${m}Metrics`]) {
            Object.keys(r[`${m}Metrics`]).forEach(key => {
              allMetrics[m][key] = (allMetrics[m][key] || 0) + r[`${m}Metrics`][key];
            });
          }
        });
      });
      
      setAllModeMetrics(allMetrics);
      toast.success("Test suite complete");
    } catch (err) {
      toast.error(`Test suite error: ${err.message}`);
    } finally {
      setIsTestRunning(false);
      setCurrentTestId(null);
    }
  }, [model, grounding]);

  const handleDownloadEvidence = useCallback(() => {
    if (!currentEvidence) {
      toast.error("No evidence to download");
      return;
    }
    
    const blob = new Blob([JSON.stringify(currentEvidence, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `evidence-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Evidence downloaded");
  }, [currentEvidence]);

  const handleClear = useCallback(() => {
    setCurrentOutput(null);
    setCurrentEvidence(null);
    setProgressStep(null);
    setProgressTimestamps({});
  }, []);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0f1113' }}>
      {/* Header */}
      <header className="sticky top-0 z-50" style={{ borderBottom: '1px solid #2a3036', backgroundColor: '#1a1f22' }}>
        <div className="max-w-[1800px] mx-auto px-6 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center">
                <span className="text-white text-xs font-bold">G3</span>
              </div>
              <div>
                <h1 className="text-base font-bold" style={{ color: '#e6e8eb' }}>Gemini 3 Governed Execution</h1>
                <p className="text-[10px]" style={{ color: '#9aa1a9' }}>Knowledge → Governance → Experience → Understanding → Reliable Output</p>
              </div>
              </div>
              <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowTelemetry(!showTelemetry)}
                className="text-xs h-7"
              >
                {showTelemetry ? "Hide" : "Show"} Execution Trace
              </Button>
              </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1800px] mx-auto px-6 py-3">
        {/* Progress Stepper */}
        {progressStep && (
          <div className="mb-3">
            <ProgressStepper step={progressStep} timestamps={progressTimestamps} />
          </div>
        )}

        {/* 3-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
          {/* Left: Prompt Panel */}
          <PromptPanel
            prompt={prompt}
            onPromptChange={setPrompt}
            mode={mode}
            onModeChange={setMode}
            grounding={grounding}
            onGroundingChange={setGrounding}
            model={model}
            onModelChange={handleModelChange}
            presets={PRESET_PROMPTS}
            onRun={handleRun}
            onClear={handleClear}
            isRunning={isRunning}
            isTestRunning={isTestRunning}
          />

          {/* Center: Output Panel */}
          <OutputPanel
            output={currentOutput}
            evidence={currentEvidence}
            mode={mode}
            isRunning={isRunning}
            showTelemetry={showTelemetry}
          />

          {/* Right: Summary Panel */}
          <SummaryPanel
            evidence={currentEvidence}
            metrics={allModeMetrics[mode]}
            mode={mode}
            onDownload={handleDownloadEvidence}
          />
        </div>

        {/* Bottom Dock: Tabs */}
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#1a1f22', borderColor: '#2a3036', border: '1px solid' }}>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="px-6 overflow-x-auto" style={{ borderBottom: '1px solid #2a3036' }}>
              <TabsList className="bg-transparent border-0 p-0 h-12 min-w-max">
                <TabsTrigger value="summary" className="data-[state=active]:border-b-2 data-[state=active]:border-[#1f6f5b] rounded-none" style={{ color: '#9aa1a9' }}>
                  Summary
                </TabsTrigger>
                <TabsTrigger value="underhood" className="data-[state=active]:border-b-2 data-[state=active]:border-[#1f6f5b] rounded-none" style={{ color: '#9aa1a9' }}>
                  Under the Hood
                </TabsTrigger>
                <TabsTrigger value="evidence" className="data-[state=active]:border-b-2 data-[state=active]:border-[#1f6f5b] rounded-none" style={{ color: '#9aa1a9' }}>
                  Evidence
                </TabsTrigger>
                <TabsTrigger value="performance" className="data-[state=active]:border-b-2 data-[state=active]:border-[#1f6f5b] rounded-none" style={{ color: '#9aa1a9' }}>
                  Performance
                </TabsTrigger>
                <TabsTrigger value="drift" className="data-[state=active]:border-b-2 data-[state=active]:border-[#1f6f5b] rounded-none" style={{ color: '#9aa1a9' }}>
                  Drift
                </TabsTrigger>
                <TabsTrigger value="artifacts" className="data-[state=active]:border-b-2 data-[state=active]:border-[#1f6f5b] rounded-none" style={{ color: '#9aa1a9' }}>
                  Artifacts
                </TabsTrigger>
                <TabsTrigger value="tests" className="data-[state=active]:border-b-2 data-[state=active]:border-[#1f6f5b] rounded-none" style={{ color: '#9aa1a9' }}>
                  Tests
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="p-6 overflow-x-auto">
              <div className="min-w-0">
                <TabsContent value="summary" className="mt-0">
                  <SummaryTab />
                </TabsContent>

                <TabsContent value="underhood" className="mt-0">
                  <UnderTheHoodPanel />
                </TabsContent>

                <TabsContent value="evidence" className="mt-0">
                  <EvidenceTab evidence={currentEvidence} mode={mode} onRunBaseline={() => handleRun("baseline")} />
                </TabsContent>
                
                <TabsContent value="performance" className="mt-0">
                  <PerformanceTab
                    allModeMetrics={allModeMetrics}
                    baselineMetrics={baselineRef.current}
                  />
                </TabsContent>
                
                <TabsContent value="drift" className="mt-0">
                  <DriftTab />
                </TabsContent>
                
                <TabsContent value="artifacts" className="mt-0">
                  <ArtifactsTab />
                </TabsContent>
                
                <TabsContent value="tests" className="mt-0">
                  <TestsTab
                    results={testResults}
                    isRunning={isTestRunning}
                    currentTestId={currentTestId}
                    onRunTestSuite={handleRunTestSuite}
                  />
                </TabsContent>
              </div>
            </div>
          </Tabs>
        </div>
      </main>


    </div>
  );
}