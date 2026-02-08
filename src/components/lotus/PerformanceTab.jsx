import React, { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
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

  const COST_PER_1K_TOKENS = 0.002; // Example: $0.002 per 1K tokens
  
  const calculateCost = (tokens) => {
    if (!tokens) return 0;
    return (tokens / 1000) * COST_PER_1K_TOKENS;
  };

  const calculateEfficiencyScore = (m) => {
    if (!m || !m.billable?.total_model_tokens || !m.total?.model_latency_ms) return null;
    // Tokens per second
    return ((m.billable.total_model_tokens / m.total.model_latency_ms) * 1000).toFixed(0);
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

  const PlaneTable = ({ title, subtitle, rows, bgColor = "bg-slate-50" }) => (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
          <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
        </div>
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-[700px]">
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className={bgColor}>
                  <TableHead className="text-xs font-bold">Metric</TableHead>
                  <TableHead className="text-center text-xs font-bold">Baseline</TableHead>
                  <TableHead className="text-center text-xs font-bold">Governed</TableHead>
                  <TableHead className="text-center text-xs font-bold">Hybrid</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>{rows}</TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );

  const executionRows = (
    <>
      <MetricRow label="Model Latency (base call)" getValue={(m) => {
        const baseLatency = m?.total?.model_latency_ms || 0;
        const repairLatency = (m?.repair?.extra_model_calls_due_to_repair || 0) * (baseLatency / (m?.total?.attempts || 1));
        return Math.max(0, baseLatency - repairLatency).toFixed(0);
      }} unit="ms" isBillable showDelta />
      <MetricRow label="Base Tokens (pre-repair)" getValue={(m) => {
        const total = m?.billable?.total_model_tokens || 0;
        const extra = m?.repair?.extra_tokens_due_to_repair || 0;
        return Math.max(0, total - extra);
      }} isBillable showDelta />
      <MetricRow label="Estimated Cost" getValue={(m) => {
        const total = m?.billable?.total_model_tokens || 0;
        const extra = m?.repair?.extra_tokens_due_to_repair || 0;
        return `$${calculateCost(Math.max(0, total - extra)).toFixed(4)}`;
      }} isBillable />
      <MetricRow label="Efficiency (tok/sec)" getValue={(m) => calculateEfficiencyScore(m)} />
    </>
  );

  const diagnosticsRows = (
    <>
      <MetricRow label="Validation Time" getValue={(m) => m?.local?.local_validation_ms} unit="ms" />
      <MetricRow label="Render Time" getValue={(m) => m?.local?.local_render_ms} unit="ms" />
      <MetricRow label="Evidence Assembly" getValue={(m) => {
        const total = m?.local?.total_local_ms || 0;
        const validation = m?.local?.local_validation_ms || 0;
        const render = m?.local?.local_render_ms || 0;
        return Math.max(0, total - validation - render).toFixed(0);
      }} unit="ms" />
      <MetricRow label="Total Runtime-local" getValue={(m) => m?.local?.total_local_ms} unit="ms" showDelta />
    </>
  );

  const repairRows = (
    <>
      <MetricRow label="Extra Model Calls" getValue={(m) => m?.repair?.extra_model_calls_due_to_repair || 0} isBillable showDelta />
      <MetricRow label="Extra Tokens (repairs)" getValue={(m) => m?.repair?.extra_tokens_due_to_repair?.toFixed(0) || 0} isBillable showDelta />
      <MetricRow label="Repair Latency (model)" getValue={(m) => {
        const baseLatency = m?.total?.model_latency_ms || 0;
        const repairCalls = m?.repair?.extra_model_calls_due_to_repair || 0;
        const attempts = m?.total?.attempts || 1;
        return (repairCalls > 0 ? (baseLatency / attempts) * repairCalls : 0).toFixed(0);
      }} unit="ms" isBillable showDelta />
      <MetricRow label="Repair Cost" getValue={(m) => {
        const extra = m?.repair?.extra_tokens_due_to_repair || 0;
        return `$${calculateCost(extra).toFixed(4)}`;
      }} isBillable showDelta />
    </>
  );

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-violet-50 to-indigo-50 border-l-4 border-violet-600 rounded-lg p-4 mb-6">
        <h2 className="text-base font-bold text-slate-900 mb-1">Execution vs Reliability Tradeoffs</h2>
        <p className="text-xs text-slate-600">
          <strong>Plane A (Execution):</strong> Base generation cost. <strong>Plane B (Diagnostics):</strong> Optional validation overhead. <strong>Plane C (Repairs):</strong> Conditional recovery cost. 
          <span className="block mt-1 text-violet-700 font-semibold">Governance increases base execution cost but reduces downstream reliability and recovery costs by preventing invalid or unstable outputs.</span>
        </p>
      </div>

      <PlaneTable
        title="🚀 Plane A: Execution (Base Generation)"
        subtitle="💵 Billable — Initial model call to generate response (no repairs)"
        rows={executionRows}
        bgColor="bg-violet-50"
      />

      <PlaneTable
        title="🔍 Plane B: Diagnostics (Runtime-Local)"
        subtitle="⚙️ Non-Billable — Browser-side validation, parsing, evidence assembly"
        rows={diagnosticsRows}
        bgColor="bg-blue-50"
      />

      <PlaneTable
        title="🔧 Plane C: Repairs (Recovery Calls)"
        subtitle="💵 Billable — Extra model calls + tokens to fix validation failures"
        rows={repairRows}
        bgColor="bg-amber-50"
      />

      <Card className="border-slate-300 bg-slate-50">
        <CardContent className="py-4">
          <h3 className="text-sm font-bold text-slate-800 mb-3">Tradeoff Analysis</h3>
          <ul className="space-y-2 text-xs text-slate-700">
            <li>• <strong>Core execution (Plane A):</strong> Governed base={(governed?.billable?.total_model_tokens || 0) - (governed?.repair?.extra_tokens_due_to_repair || 0)}t vs Baseline={baseline?.billable?.total_model_tokens || 0}t — structured output reduces verbosity</li>
            <li>• <strong>Reliability overhead (Plane B):</strong> {governed?.local?.total_local_ms || 0}ms validation — optional, non-billable, enables audit compliance</li>
            <li>• <strong>Conditional repairs (Plane C):</strong> {governed?.repair?.extra_model_calls_due_to_repair || 0} recovery calls when validation fails — billable but contained</li>
            <li>• <strong>Experience accumulation:</strong> Hybrid saves {hybrid?.hybrid_tokens_saved || 0}t via artifact context — system learns from governed outcomes</li>
            <li>• <strong>Safe Mode containment:</strong> When contract unsatisfiable, output withheld — correct governance outcome, not system failure</li>
          </ul>
        </CardContent>
      </Card>

      {hasAuditData && (
        <div className="border-t-4 border-blue-300 pt-6 mt-8">
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-l-4 border-blue-600 rounded-lg p-4 mb-4">
            <h2 className="text-base font-bold text-slate-900 mb-1">Diagnostics (Optional / Non-Default)</h2>
            <p className="text-xs text-slate-600">
              <strong>Post-execution analysis:</strong> Async audits run after response returned. <strong className="text-blue-700">Not included in execution latency or billable metrics.</strong> Enable in settings if needed.
            </p>
          </div>
          <h3 className="text-sm font-semibold text-slate-800 mb-3">Audit Path Metrics</h3>
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