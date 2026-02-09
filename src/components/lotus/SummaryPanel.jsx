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
    <div className={`rounded-lg p-2 ${tokenDelta > 0 ? 'bg-destructive/10 border border-destructive/20' : tokenDelta < 0 ? 'bg-primary/10 border border-primary/20' : 'bg-secondary'}`}>
      <div className="flex items-center gap-1 mb-0.5">
        {tokenDelta > 0 ? (
          <TrendingUp className="w-3 h-3 text-destructive" />
        ) : tokenDelta < 0 ? (
          <TrendingDown className="w-3 h-3 text-primary" />
        ) : (
          <TrendingUp className="w-3 h-3 text-muted-foreground" />
        )}
        <span className="text-[10px] font-medium text-muted-foreground">Conditional Overhead</span>
      </div>
      <p className={`text-base font-bold ${tokenDelta > 0 ? 'text-destructive' : tokenDelta < 0 ? 'text-primary' : 'text-foreground'}`}>
        {tokenDelta > 0 ? '+' : ''}{tokenDelta}t
      </p>
      <p className={`text-[10px] ${latencyDelta > 0 ? 'text-destructive' : latencyDelta < 0 ? 'text-primary' : 'text-muted-foreground'}`}>
        Recovery path
      </p>
    </div>
  );
}

export default function SummaryPanel({ evidence, metrics, mode, onDownload }) {
  if (!evidence) {
    return (
      <Card className="h-full surface">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-card-foreground">Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm italic text-muted-foreground">No run data yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full surface">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold text-card-foreground">Execution Summary</CardTitle>
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
            evidence.validation_passed ? "bg-primary" :
            evidence.safe_mode_applied ? "bg-primary" :
            "bg-destructive"
          } text-primary-foreground text-xs px-2 py-1 whitespace-nowrap`}>
            {evidence.validation_passed ? "✓ Contract Satisfied" : evidence.safe_mode_applied ? "✓ Model-Limited Execution (Contained)" : "✗ Failed"}
          </Badge>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg p-2 bg-secondary border border-border">
            <div className="flex items-center gap-1 mb-0.5">
              <Clock className="w-3 h-3 text-muted-foreground" />
              <span className="text-[10px] font-medium text-muted-foreground">Latency</span>
            </div>
            <p className="text-base font-bold text-foreground">{evidence.latency_ms}ms</p>
            <p className="text-[10px] text-muted-foreground">💵 {evidence.model_latency_ms}ms ⚙️ {evidence.local_latency_ms}ms</p>
          </div>

          <div className="rounded-lg p-2 bg-secondary border border-border">
            <div className="flex items-center gap-1 mb-0.5">
              <Zap className="w-3 h-3 text-muted-foreground" />
              <span className="text-[10px] font-medium text-muted-foreground">Attempts</span>
            </div>
            <p className="text-base font-bold text-foreground">{evidence.attempts}</p>
            <p className="text-[10px] text-muted-foreground">💵 {evidence.repairs} {evidence.local_repairs > 0 ? `⚙️ ${evidence.local_repairs}` : ''}</p>
          </div>

          {evidence.repairs > 0 && <BaselineDeltaCard metrics={metrics} mode={mode} repairs={evidence.repairs} />}
        </div>

        <div className="pt-2 space-y-0.5 text-[10px] border-t border-border">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Mode / Grounding:</span>
            <span className="font-medium text-foreground">{evidence.mode} / {evidence.grounding}</span>
          </div>
          {evidence.validation_summary && (
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">
                {evidence.safe_mode_applied ? "Validation:" : "Validation:"}
              </span>
              <span className="font-medium text-foreground">
                {evidence.safe_mode_applied 
                  ? "Not satisfied (contained)" 
                  : `${evidence.validation_summary.passed_checks} / ${evidence.validation_summary.total_checks} passed`
                }
              </span>
            </div>
          )}
          {evidence.safe_mode_applied && (
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Evidence:</span>
              <span className="font-medium text-primary">Saved</span>
            </div>
          )}
          {evidence.hybrid_context_injected && (
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Hybrid Context:</span>
              <span className="font-medium text-primary">~{evidence.hybrid_tokens_saved}t saved</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}