import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Clock, Zap, Download, FileJson, TrendingUp, TrendingDown } from "lucide-react";
import { downloadEvidenceFile } from "./auditExporter";
import { getBaselineSnapshot, getRunState } from "./runStore";
import PipelineStatus from "./PipelineStatus";

function BaselineDeltaCard({ metrics, mode, repairs }) {
  if (!metrics || mode === "baseline" || !repairs || repairs === 0) {
    return null;
  }

  const runState = getRunState();
  const baselineSnap = getBaselineSnapshot(runState.prompt_hash, runState.model, runState.grounding);
  if (!baselineSnap?.execution_metrics) return null;

  const baselineMetrics = baselineSnap.execution_metrics;
  const tokenDelta = (metrics.billable?.total_model_tokens || 0) - (baselineMetrics.total_tokens || 0);
  const latencyDelta = (metrics.total?.model_latency_ms || 0) - (baselineMetrics.model_latency_ms || 0);

  return (
    <div className="rounded-lg p-2" style={{ backgroundColor: tokenDelta > 0 ? 'rgba(200, 120, 84, 0.08)' : tokenDelta < 0 ? 'rgba(46, 139, 117, 0.08)' : '#20262a' }}>
      <div className="flex items-center gap-1 mb-0.5">
        {tokenDelta > 0 ? (
          <TrendingUp className="w-3 h-3" style={{ color: '#c0866d' }} />
        ) : tokenDelta < 0 ? (
          <TrendingDown className="w-3 h-3" style={{ color: '#2e8b75' }} />
        ) : (
          <TrendingUp className="w-3 h-3" style={{ color: '#9aa1a9' }} />
        )}
        <span className="text-[10px] font-medium" style={{ color: '#9aa1a9' }}>Conditional Overhead</span>
      </div>
      <p className="text-base font-bold" style={{ color: tokenDelta > 0 ? '#c0866d' : tokenDelta < 0 ? '#2e8b75' : '#e6e8eb' }}>
        {tokenDelta > 0 ? '+' : ''}{tokenDelta}t
      </p>
      <p className="text-[10px]" style={{ color: latencyDelta > 0 ? '#c0866d' : latencyDelta < 0 ? '#2e8b75' : '#9aa1a9' }}>
        Recovery path
      </p>
    </div>
  );
}

export default function SummaryPanel({ evidence, metrics, mode, onDownload }) {
  if (!evidence) {
    return (
      <Card className="shadow-sm h-full" style={{ backgroundColor: '#1a1f22', borderColor: '#2a3036' }}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold" style={{ color: '#e6e8eb' }}>Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm italic" style={{ color: '#6f7679' }}>No run data yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm h-full" style={{ backgroundColor: '#1a1f22', borderColor: '#2a3036' }}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold" style={{ color: '#e6e8eb' }}>Execution Summary</CardTitle>
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
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <PipelineStatus 
              stage={evidence.safe_mode_applied ? "governance" : "output"} 
              safeModeApplied={evidence.safe_mode_applied}
              validationPassed={evidence.validation_passed}
            />
          </div>
          <Badge className={`${
            evidence.validation_passed ? "bg-green-600" :
            evidence.safe_mode_applied ? "bg-green-600" :
            "bg-red-600"
          } text-white text-xs px-2 py-1 whitespace-nowrap`}>
            {evidence.validation_passed ? "✓ Contract Satisfied" : evidence.safe_mode_applied ? "✓ Model-Limited Execution" : "✗ Failed"}
          </Badge>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg p-2" style={{ backgroundColor: '#20262a' }}>
            <div className="flex items-center gap-1 mb-0.5">
              <Clock className="w-3 h-3" style={{ color: '#9aa1a9' }} />
              <span className="text-[10px] font-medium" style={{ color: '#9aa1a9' }}>Latency</span>
            </div>
            <p className="text-base font-bold" style={{ color: '#e6e8eb' }}>{evidence.latency_ms}ms</p>
            <p className="text-[10px]" style={{ color: '#9aa1a9' }}>💵 {evidence.model_latency_ms}ms ⚙️ {evidence.local_latency_ms}ms</p>
          </div>

          <div className="rounded-lg p-2" style={{ backgroundColor: '#20262a' }}>
            <div className="flex items-center gap-1 mb-0.5">
              <Zap className="w-3 h-3" style={{ color: '#9aa1a9' }} />
              <span className="text-[10px] font-medium" style={{ color: '#9aa1a9' }}>Attempts</span>
            </div>
            <p className="text-base font-bold" style={{ color: '#e6e8eb' }}>{evidence.attempts}</p>
            <p className="text-[10px]" style={{ color: '#9aa1a9' }}>💵 {evidence.repairs} {evidence.local_repairs > 0 ? `⚙️ ${evidence.local_repairs}` : ''}</p>
          </div>

          {evidence.repairs > 0 && <BaselineDeltaCard metrics={metrics} mode={mode} repairs={evidence.repairs} />}
        </div>

        <div className="pt-2 space-y-0.5 text-[10px]" style={{ borderTop: '1px solid #2a3036' }}>
          <div className="flex justify-between items-center">
            <span style={{ color: '#9aa1a9' }}>Mode / Grounding:</span>
            <span className="font-medium" style={{ color: '#e6e8eb' }}>{evidence.mode} / {evidence.grounding}</span>
          </div>
          {evidence.validation_summary && (
            <div className="flex justify-between items-center">
              <span style={{ color: '#9aa1a9' }}>Validation:</span>
              <span className="font-medium" style={{ color: '#e6e8eb' }}>
                {evidence.validation_summary.passed_checks} / {evidence.validation_summary.total_checks} passed
              </span>
            </div>
          )}
          {evidence.hybrid_context_injected && (
            <div className="flex justify-between items-center">
              <span style={{ color: '#9aa1a9' }}>Hybrid Context:</span>
              <span className="font-medium" style={{ color: '#1f6f5b' }}>~{evidence.hybrid_tokens_saved}t saved</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}