import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function PerformanceTab({ allModeMetrics }) {
  if (!allModeMetrics || Object.keys(allModeMetrics).length === 0) {
    return (
      <Card className="border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-slate-700">Performance Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-400 italic">Run tests to see performance breakdown.</p>
        </CardContent>
      </Card>
    );
  }

  const { baseline, governed, hybrid } = allModeMetrics;

  const MetricRow = ({ label, getValue, unit = "", isBillable = false }) => (
    <TableRow>
      <TableCell className="text-xs font-medium text-slate-700">
        {label}
        {isBillable && (
          <Badge className="ml-2 bg-red-100 text-red-700 text-[9px]">Billable</Badge>
        )}
      </TableCell>
      <TableCell className="text-center">
        <span className="font-mono text-xs">{getValue(baseline) || "—"}{unit}</span>
      </TableCell>
      <TableCell className="text-center">
        <span className="font-mono text-xs">{getValue(governed) || "—"}{unit}</span>
      </TableCell>
      <TableCell className="text-center">
        <span className="font-mono text-xs">{getValue(hybrid) || "—"}{unit}</span>
      </TableCell>
    </TableRow>
  );

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-slate-700">Performance Breakdown</CardTitle>
        <p className="text-xs text-slate-500 mt-1">Billable (model) vs Local (runtime) costs</p>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
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
              <MetricRow
                label="Prompt Tokens (In)"
                getValue={(m) => m?.billable?.prompt_tokens_in}
                isBillable
              />
              <MetricRow
                label="Completion Tokens (Out)"
                getValue={(m) => m?.billable?.completion_tokens_out}
                isBillable
              />
              <MetricRow
                label="Total Model Tokens"
                getValue={(m) => m?.billable?.total_model_tokens}
                isBillable
              />
              <MetricRow
                label="Repair Attempts"
                getValue={(m) => m?.repair?.repair_attempts_count}
              />
              <MetricRow
                label="Extra Model Calls"
                getValue={(m) => m?.repair?.extra_model_calls_due_to_repair}
                isBillable
              />
              <MetricRow
                label="Extra Tokens (Repairs)"
                getValue={(m) => m?.repair?.extra_tokens_due_to_repair?.toFixed(0)}
                isBillable
              />
              <MetricRow
                label="Model Latency"
                getValue={(m) => m?.total?.model_latency_ms}
                unit="ms"
                isBillable
              />
              <MetricRow
                label="Local Validation"
                getValue={(m) => m?.local?.local_validation_ms}
                unit="ms"
              />
              <MetricRow
                label="Local Render"
                getValue={(m) => m?.local?.local_render_ms}
                unit="ms"
              />
              <MetricRow
                label="Total Local"
                getValue={(m) => m?.local?.total_local_ms}
                unit="ms"
              />
              <MetricRow
                label="Total Latency"
                getValue={(m) => m?.total?.total_latency_ms}
                unit="ms"
              />
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}