import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Clock, Zap, Download, FileJson, TrendingUp, TrendingDown, Shield } from "lucide-react";
import { downloadEvidenceFile } from "./auditExporter";
import { getBaselineSnapshot, hasBaselineSnapshot, getRunState } from "./runStore";
import PipelineStatus from "./PipelineStatus";

function BaselineDeltaCard({ metrics, mode }) {
  const [baselineAvailable, setBaselineAvailable] = useState(false);
  const runState = getRunState();

  useEffect(() => {
    if (runState.prompt_hash && runState.model && runState.grounding && mode !== "baseline") {
      setBaselineAvailable(hasBaselineSnapshot(runState.prompt_hash, runState.model, runState.grounding));
    }
  }, [runState.prompt_hash, runState.model, runState.grounding, mode]);

  if (!metrics || mode === "baseline" || !baselineAvailable) {
    return (
      <div className="bg-slate-50 rounded-lg p-3">
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp className="w-3 h-3 text-slate-400" />
          <span className="text-xs text-slate-400 font-medium">Δ vs Baseline</span>
        </div>
        <p className="text-xs text-slate-400 mt-2">No baseline</p>
      </div>
    );
  }

  const baselineSnap = getBaselineSnapshot(runState.prompt_hash, runState.model, runState.grounding);
  if (!baselineSnap) return null;

  const tokenDelta = (metrics.billable?.total_model_tokens || 0) - (baselineSnap.performance.total_model_tokens || 0);
  const latencyDelta = (metrics.total?.total_latency_ms || 0) - (baselineSnap.performance.total_latency_ms || 0);

  return (
    <div className={`rounded-lg p-3 ${tokenDelta > 0 ? 'bg-red-50' : tokenDelta < 0 ? 'bg-green-50' : 'bg-slate-50'}`}>
      <div className="flex items-center gap-2 mb-1">
        {tokenDelta > 0 ? (
          <TrendingUp className="w-3 h-3 text-red-600" />
        ) : tokenDelta < 0 ? (
          <TrendingDown className="w-3 h-3 text-green-600" />
        ) : (
          <TrendingUp className="w-3 h-3 text-slate-500" />
        )}
        <span className="text-xs text-slate-600 font-medium">Δ vs Baseline</span>
      </div>
      <p className={`text-lg font-bold ${tokenDelta > 0 ? 'text-red-700' : tokenDelta < 0 ? 'text-green-700' : 'text-slate-700'}`}>
        {tokenDelta > 0 ? '+' : ''}{tokenDelta}t
      </p>
      <p className={`text-xs ${latencyDelta > 0 ? 'text-red-600' : latencyDelta < 0 ? 'text-green-600' : 'text-slate-500'}`}>
        {latencyDelta > 0 ? '+' : ''}{latencyDelta}ms latency
      </p>
    </div>
  );
}

export default function SummaryPanel({ evidence, metrics, mode, onDownload }) {
  if (!evidence) {
    return (
      <Card className="border-slate-200 shadow-sm h-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-slate-700">Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-400 italic">No run data yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-200 shadow-sm h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold text-slate-700">Execution Summary (Production)</CardTitle>
          <div className="flex gap-1">
            {onDownload && (
              <Button variant="ghost" size="sm" onClick={onDownload} className="h-7">
                <Download className="w-3 h-3 mr-1" />
                Evidence
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={downloadEvidenceFile} className="h-7">
              <FileJson className="w-3 h-3 mr-1" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="mb-4">
          <PipelineStatus 
            stage={evidence.safe_mode_applied ? "governance" : "output"} 
            safeModeApplied={evidence.safe_mode_applied}
          />
        </div>

        <div className="flex items-center gap-2">
          {evidence.validation_passed ? (
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          ) : evidence.safe_mode_applied ? (
            <Shield className="w-5 h-5 text-amber-600" />
          ) : (
            <XCircle className="w-5 h-5 text-red-500" />
          )}
          <span className="text-sm font-medium text-slate-700">
            {evidence.validation_passed ? "Contract Satisfied" : evidence.safe_mode_applied ? "Output Withheld (Correct)" : "Validation Failed"}
          </span>
        </div>

        {evidence.safe_mode_applied && (
          <div className="bg-amber-50 border-l-4 border-amber-600 rounded-lg p-3">
            <p className="text-xs text-amber-800 font-semibold flex items-center gap-2">
              <Shield className="w-3.5 h-3.5" />
              Governance Protection Applied
            </p>
            <p className="text-xs text-amber-700 mt-1">Contract requirements not met after repair attempts. Output withheld to maintain reliability standards.</p>
          </div>
        )}

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-slate-50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-3 h-3 text-slate-500" />
              <span className="text-xs text-slate-500 font-medium">Latency</span>
            </div>
            <p className="text-lg font-bold text-slate-900">{evidence.latency_ms}ms</p>
            <p className="text-xs text-slate-500" title="Billable model time">💵 Model: {evidence.model_latency_ms}ms</p>
            <p className="text-xs text-slate-400" title="App runtime (non-billable)">⚙️ Local: {evidence.local_latency_ms}ms</p>
          </div>

          <div className="bg-slate-50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-3 h-3 text-slate-500" />
              <span className="text-xs text-slate-500 font-medium">Attempts</span>
            </div>
            <p className="text-lg font-bold text-slate-900">{evidence.attempts}</p>
            <p className="text-xs text-slate-500">💵 Repairs: {evidence.repairs}</p>
            {evidence.local_repairs > 0 && (
              <p className="text-xs text-slate-400">⚙️ Local: {evidence.local_repairs}</p>
            )}
          </div>

          <BaselineDeltaCard metrics={metrics} mode={mode} />
        </div>

        {evidence.validation_summary && (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-slate-700">Validation Details</h4>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-600">Total Checks:</span>
                <span className="font-medium">{evidence.validation_summary.total_checks}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Passed:</span>
                <span className="font-medium text-green-600">{evidence.validation_summary.passed_checks}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Failed:</span>
                <span className="font-medium text-red-600">{evidence.validation_summary.failed_checks}</span>
              </div>
            </div>
          </div>
        )}

        {evidence.hybrid_context_injected && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
            <p className="text-xs text-emerald-800 font-medium">Hybrid Context Injected</p>
            <p className="text-xs text-emerald-700 mt-1">Tokens saved: ~{evidence.hybrid_tokens_saved}</p>
          </div>
        )}

        <div className="pt-3 border-t border-slate-200 space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-600">Mode:</span>
            <Badge variant="secondary" className="text-[10px]">{evidence.mode}</Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Grounding:</span>
            <Badge variant="secondary" className="text-[10px]">{evidence.grounding}</Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Request ID:</span>
            <span className="font-mono text-[10px] text-slate-500">{evidence.request_id?.substring(0, 8)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}