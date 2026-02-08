import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function PerformanceTab({ allModeMetrics, baselineMetrics }) {
  if (!allModeMetrics || Object.keys(allModeMetrics).length === 0) {
    return <p className="text-sm text-slate-400 italic">No performance data yet. Run tests to see metrics.</p>;
  }

  const { baseline, governed, hybrid } = allModeMetrics;

  const MetricRow = ({ label, getValue, unit = "", isBillable = false }) => (
    <TableRow>
      <TableCell className="text-xs font-medium text-slate-700">
        {label}
        {isBillable && <Badge className="ml-2 bg-red-100 text-red-700 text-[9px]">Billable</Badge>}
      </TableCell>
      <TableCell className="text-center text-xs font-mono">{getValue(baseline) || "—"}{unit}</TableCell>
      <TableCell className="text-center text-xs font-mono">{getValue(governed) || "—"}{unit}</TableCell>
      <TableCell className="text-center text-xs font-mono">{getValue(hybrid) || "—"}{unit}</TableCell>
    </TableRow>
  );

  return (
    <div className="space-y-6">
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
              <MetricRow label="End-to-End Latency" getValue={(m) => m?.total?.total_latency_ms} unit="ms" />
              <MetricRow label="Model Latency" getValue={(m) => m?.total?.model_latency_ms} unit="ms" isBillable />
              <MetricRow label="Local Latency" getValue={(m) => m?.local?.total_local_ms} unit="ms" />
              <MetricRow label="Prompt Tokens" getValue={(m) => m?.billable?.prompt_tokens_in} isBillable />
              <MetricRow label="Completion Tokens" getValue={(m) => m?.billable?.completion_tokens_out} isBillable />
              <MetricRow label="Total Tokens" getValue={(m) => m?.billable?.total_model_tokens} isBillable />
              <MetricRow label="Extra Model Calls" getValue={(m) => m?.repair?.extra_model_calls_due_to_repair} isBillable />
            </TableBody>
          </Table>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-slate-800 mb-3">Billable vs Local Breakdown</h3>
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
                <TableCell colSpan={4} className="text-xs font-bold text-slate-800">Local (Runtime)</TableCell>
              </TableRow>
              <MetricRow label="Validation" getValue={(m) => m?.local?.local_validation_ms} unit="ms" />
              <MetricRow label="Render" getValue={(m) => m?.local?.local_render_ms} unit="ms" />
              <MetricRow label="Total Local" getValue={(m) => m?.local?.total_local_ms} unit="ms" />
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}