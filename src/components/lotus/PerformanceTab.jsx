import React, { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUp, ArrowDown } from "lucide-react";

export default function PerformanceTab({ allModeMetrics, baselineMetrics }) {
  const [showOnlyBillable, setShowOnlyBillable] = useState(false);

  if (!allModeMetrics || Object.keys(allModeMetrics).length === 0) {
    return <p className="text-sm text-slate-400 italic">No performance data yet. Run tests to see metrics.</p>;
  }

  const { baseline, governed, hybrid } = allModeMetrics;
  
  const getDelta = (val, baseVal) => {
    if (!val || !baseVal) return null;
    const delta = val - baseVal;
    return delta;
  };

  const MetricRow = ({ label, getValue, unit = "", isBillable = false, showDelta = false }) => {
    const baseVal = getValue(baseline);
    const govVal = getValue(governed);
    const hybVal = getValue(hybrid);
    
    return (
      <TableRow>
        <TableCell className="text-xs font-medium text-slate-700">
          {label}
          {isBillable && <Badge className="ml-2 bg-red-100 text-red-700 text-[9px]">Billable</Badge>}
        </TableCell>
        <TableCell className="text-center text-xs font-mono">{baseVal || "—"}{unit}</TableCell>
        <TableCell className="text-center text-xs">
          <div className="flex items-center justify-center gap-1">
            <span className="font-mono">{govVal || "—"}{unit}</span>
            {showDelta && baseVal && govVal && (
              <span className={`text-[10px] ${getDelta(govVal, baseVal) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {getDelta(govVal, baseVal) > 0 ? <ArrowUp className="w-3 h-3 inline" /> : <ArrowDown className="w-3 h-3 inline" />}
                {Math.abs(getDelta(govVal, baseVal)).toFixed(0)}
              </span>
            )}
          </div>
        </TableCell>
        <TableCell className="text-center text-xs">
          <div className="flex items-center justify-center gap-1">
            <span className="font-mono">{hybVal || "—"}{unit}</span>
            {showDelta && baseVal && hybVal && (
              <span className={`text-[10px] ${getDelta(hybVal, baseVal) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {getDelta(hybVal, baseVal) > 0 ? <ArrowUp className="w-3 h-3 inline" /> : <ArrowDown className="w-3 h-3 inline" />}
                {Math.abs(getDelta(hybVal, baseVal)).toFixed(0)}
              </span>
            )}
          </div>
        </TableCell>
      </TableRow>
    );
  };

  const hasAuditData = allModeMetrics?.governed?.audit || allModeMetrics?.hybrid?.audit;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">Execution Metrics (Billable)</h3>
          <p className="text-xs text-slate-500 mt-1">
            <strong>Execution only:</strong> Model calls to produce the returned answer. <strong>Runtime-local:</strong> System-side validation/parsing (non-billable). <strong>Audit metrics shown separately below.</strong>
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowOnlyBillable(!showOnlyBillable)}
        >
          {showOnlyBillable ? "Show Full Breakdown" : "Show Only Billable"}
        </Button>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-slate-800 mb-3">Mode-by-Mode Totals</h3>
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="text-xs font-bold">Metric</TableHead>
                <TableHead className="text-center text-xs font-bold">Baseline</TableHead>
                <TableHead className="text-center text-xs font-bold">Governed</TableHead>
                <TableHead className="text-center text-xs font-bold">Hybrid</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <MetricRow label="End-to-End Latency" getValue={(m) => m?.total?.total_latency_ms} unit="ms" showDelta />
              <MetricRow label="Model Latency (billable)" getValue={(m) => m?.total?.model_latency_ms} unit="ms" isBillable showDelta />
              {!showOnlyBillable && <MetricRow label="Runtime-local (non-billable)" getValue={(m) => m?.local?.total_local_ms} unit="ms" />}
              <MetricRow label="Prompt Tokens" getValue={(m) => m?.billable?.prompt_tokens_in} isBillable showDelta />
              <MetricRow label="Completion Tokens" getValue={(m) => m?.billable?.completion_tokens_out} isBillable showDelta />
              <MetricRow label="Total Tokens" getValue={(m) => m?.billable?.total_model_tokens} isBillable showDelta />
              <MetricRow label="Extra Model Calls" getValue={(m) => m?.repair?.extra_model_calls_due_to_repair} isBillable showDelta />
            </TableBody>
          </Table>
        </div>
      </div>

      {!showOnlyBillable && (
        <div>
          <h3 className="text-sm font-semibold text-slate-800 mb-3">Billable vs App Runtime Breakdown</h3>
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="text-xs font-bold">Metric</TableHead>
                <TableHead className="text-center text-xs font-bold">Baseline</TableHead>
                <TableHead className="text-center text-xs font-bold">Governed</TableHead>
                <TableHead className="text-center text-xs font-bold">Hybrid</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow className="bg-red-50/50">
                <TableCell colSpan={4} className="text-xs font-bold text-red-800">Billable (Model)</TableCell>
              </TableRow>
              <MetricRow label="Prompt Tokens In" getValue={(m) => m?.billable?.prompt_tokens_in} />
              <MetricRow label="Completion Tokens Out" getValue={(m) => m?.billable?.completion_tokens_out} />
              <MetricRow label="Total Model Tokens" getValue={(m) => m?.billable?.total_model_tokens} />
              <MetricRow label="Extra Tokens (Repairs)" getValue={(m) => m?.repair?.extra_tokens_due_to_repair?.toFixed(0)} />
              <MetricRow label="Model Latency" getValue={(m) => m?.total?.model_latency_ms} unit="ms" />
              
              <TableRow className="bg-slate-50">
                <TableCell colSpan={4} className="text-xs font-bold text-slate-800">
                  Runtime-local (non-billable)
                  <span className="ml-2 text-[10px] text-slate-500 font-normal">
                    Browser/runtime + artifact store: validation, parsing, evidence assembly — not billable model time
                  </span>
                </TableCell>
              </TableRow>
              <MetricRow label="Validation" getValue={(m) => m?.local?.local_validation_ms} unit="ms" />
              <MetricRow label="Render" getValue={(m) => m?.local?.local_render_ms} unit="ms" />
              <MetricRow label="Total Runtime-local" getValue={(m) => m?.local?.total_local_ms} unit="ms" />
            </TableBody>
          </Table>
        </div>
        </div>
      )}

      {hasAuditData && (
        <div className="border-t-2 border-slate-300 pt-6">
          <h3 className="text-sm font-semibold text-slate-800 mb-3">Audit Path Metrics (Non-Blocking)</h3>
          <p className="text-xs text-slate-500 mb-4">
            <strong>Separate from execution:</strong> Async audits run after response returned. Not included in execution latency or billable metrics.
          </p>
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="py-4">
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-600">Audit Status:</span>
                  <Badge className={`${
                    (allModeMetrics?.governed?.audit?.status || allModeMetrics?.hybrid?.audit?.status) === "complete" ? "bg-green-600" :
                    (allModeMetrics?.governed?.audit?.status || allModeMetrics?.hybrid?.audit?.status) === "running" ? "bg-blue-600" :
                    (allModeMetrics?.governed?.audit?.status || allModeMetrics?.hybrid?.audit?.status) === "failed" ? "bg-red-600" :
                    "bg-slate-500"
                  }`}>
                    {(allModeMetrics?.governed?.audit?.status || allModeMetrics?.hybrid?.audit?.status || "pending").toUpperCase()}
                  </Badge>
                </div>
                {(allModeMetrics?.governed?.audit?.duration_ms || allModeMetrics?.hybrid?.audit?.duration_ms) && (
                  <div className="flex justify-between">
                    <span className="text-slate-600">Audit Duration:</span>
                    <span className="font-mono text-slate-800">
                      {allModeMetrics?.governed?.audit?.duration_ms || allModeMetrics?.hybrid?.audit?.duration_ms}ms
                    </span>
                  </div>
                )}
                {(allModeMetrics?.governed?.audit?.depth || allModeMetrics?.hybrid?.audit?.depth) && (
                  <div className="flex justify-between">
                    <span className="text-slate-600">Audit Depth:</span>
                    <span className="text-slate-800">
                      {allModeMetrics?.governed?.audit?.depth || allModeMetrics?.hybrid?.audit?.depth}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}