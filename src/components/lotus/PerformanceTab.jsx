import React, { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getModelConfig } from "./modelConfigStore";


 export default function PerformanceTab({ allModeMetrics, baselineMetrics }) {
  const [showOnlyBillable, setShowOnlyBillable] = useState(false);

  if (!allModeMetrics || Object.keys(allModeMetrics).length === 0) {
    return <p className="text-sm text-slate-400 italic">No performance data yet. Run tests to see metrics.</p>;
  }

  const { baseline, governed, hybrid } = allModeMetrics;
  
  const safe = (x) => (x ?? 0);
  const toNum = (v) => {
    if (v == null || v === "") return 0;
    if (typeof v === "number") return Number.isFinite(v) ? v : 0;
    const n = parseFloat(String(v).replace(/[^0-9.\-]/g, ""));
    return Number.isFinite(n) ? n : 0;
  };
  const getDelta = (val, baseVal) => {
    const delta = toNum(safe(val)) - toNum(safe(baseVal));
    return Number.isFinite(delta) ? delta : 0;
  };

  const COST_PER_1K_TOKENS = 0.002; // Example: $0.002 per 1K tokens
  
  const calculateCost = (tokens) => {
    const t = toNum(tokens);
    return (t / 1000) * COST_PER_1K_TOKENS;
  };

  const calculateEfficiencyScore = (m) => {
    const tok = toNum(m?.billable?.total_model_tokens);
    const lat = toNum(m?.total?.model_latency_ms);
    if (tok === 0 || lat === 0) return 0;
    // Tokens per second
    return Number(((tok / lat) * 1000).toFixed(0));
  };


  const MetricRow = ({ label, getValue, unit = "", isBillable = false, showDelta = false, type = "number" }) => {
    const baseVal = getValue(baseline);
    const govVal = getValue(governed);
    const hybVal = getValue(hybrid);

    const baseNum = toNum(baseVal);
    const govNum = toNum(govVal);
    const hybNum = toNum(hybVal);

    const deltaGov = getDelta(govNum, baseNum);
    const deltaHyb = getDelta(hybNum, baseNum);

    const shouldShowGov = showDelta && !(baseNum === 0 && govNum === 0) && deltaGov !== 0;
    const shouldShowHyb = showDelta && !(baseNum === 0 && hybNum === 0) && deltaHyb !== 0;

    const formatValue = (n) => {
      if (n == null) return "—";
      const v = toNum(n);
      if (type === "cost") return `$${v.toFixed(4)}`;
      if (type === "ms") return `${Math.round(v)} ms`;
      if (type === "tokens") return `${Math.round(v)} tokens`;
      return `${Math.round(v)}`;
    };

    const formatDelta = (d) => {
      if (!Number.isFinite(d) || d === 0) return "—";
      const sign = d > 0 ? "+" : "-";
      const mag = type === "cost" ? Math.abs(d).toFixed(4) : String(Math.abs(Math.round(d)));
      return `(${sign}${mag})`;
    };

    const baseDisplay = formatValue(baseNum);
    const govDeltaDisplay = shouldShowGov ? formatDelta(deltaGov) : "—";
    const hybDeltaDisplay = shouldShowHyb ? formatDelta(deltaHyb) : "—";

    return (
      <TableRow>
        <TableCell className="text-xs font-medium text-slate-700">
          {label}
          {isBillable && <Badge className="ml-2 bg-red-100 text-red-700 text-[9px]">Billable</Badge>}
        </TableCell>
        <TableCell className="text-center text-xs font-mono">{baseDisplay}</TableCell>
        <TableCell className="text-center text-xs">
          <div className="flex items-center justify-center gap-2">
            <span className="font-mono">{formatValue(govNum)}</span>
            <span className="text-[10px] text-slate-500">{govDeltaDisplay}</span>
          </div>
        </TableCell>
        <TableCell className="text-center text-xs">
          <div className="flex items-center justify-center gap-2">
            <span className="font-mono">{formatValue(hybNum)}</span>
            <span className="text-[10px] text-slate-500">{hybDeltaDisplay}</span>
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
        const baseLatency = toNum(m?.total?.model_latency_ms);
        const attempts = Math.max(1, toNum(m?.total?.attempts));
        const repairCalls = toNum(m?.repair?.extra_model_calls_due_to_repair);
        const repairLatency = repairCalls * (baseLatency / attempts);
        const val = Math.max(0, baseLatency - repairLatency);
        return Number.isFinite(val) ? Number(val.toFixed(0)) : 0;
      }} type="ms" isBillable showDelta />
      <MetricRow label="Base Tokens (pre-repair)" getValue={(m) => {
        const total = toNum(m?.billable?.total_model_tokens);
        const extra = toNum(m?.repair?.extra_tokens_due_to_repair);
        return Math.max(0, total - extra);
      }} type="tokens" isBillable showDelta />
      <MetricRow label="Estimated Cost" getValue={(m) => {
        const total = toNum(m?.billable?.total_model_tokens);
        const extra = toNum(m?.repair?.extra_tokens_due_to_repair);
        const cost = calculateCost(Math.max(0, total - extra));
        return cost;
      }} type="cost" isBillable showDelta />
      <MetricRow label="Efficiency (tok/sec)" getValue={(m) => calculateEfficiencyScore(m)} />
    </>
  );

  const diagnosticsRows = (
    <>
      <MetricRow label="Validation Time" getValue={(m) => toNum(m?.local?.local_validation_ms)} type="ms" />
      <MetricRow label="Render Time" getValue={(m) => toNum(m?.local?.local_render_ms)} type="ms" />
      <MetricRow label="Evidence Assembly" getValue={(m) => {
        const total = toNum(m?.local?.total_local_ms);
        const validation = toNum(m?.local?.local_validation_ms);
        const render = toNum(m?.local?.local_render_ms);
        const val = Math.max(0, total - validation - render);
        return Number.isFinite(val) ? Number(val.toFixed(0)) : 0;
      }} type="ms" />
      <MetricRow label="Total Runtime-local" getValue={(m) => toNum(m?.local?.total_local_ms)} type="ms" showDelta />
    </>
  );

  const repairRows = (
    <>
      <MetricRow label="Extra Model Calls" getValue={(m) => toNum(m?.repair?.extra_model_calls_due_to_repair)} isBillable showDelta />
      <MetricRow label="Extra Tokens (repairs)" getValue={(m) => {
        const extra = toNum(m?.repair?.extra_tokens_due_to_repair);
        return Number.isFinite(extra) ? Number(extra.toFixed(0)) : 0;
      }} type="tokens" isBillable showDelta />
      <MetricRow label="Repair Latency (model)" getValue={(m) => {
        const baseLatency = toNum(m?.total?.model_latency_ms);
        const repairCalls = toNum(m?.repair?.extra_model_calls_due_to_repair);
        const attempts = Math.max(1, toNum(m?.total?.attempts));
        const val = repairCalls > 0 ? (baseLatency / attempts) * repairCalls : 0;
        return Number.isFinite(val) ? Number(val.toFixed(0)) : 0;
      }} type="ms" isBillable showDelta />
      <MetricRow label="Repair Cost" getValue={(m) => {
        const extra = toNum(m?.repair?.extra_tokens_due_to_repair);
        const cost = calculateCost(extra);
        return cost;
      }} type="cost" isBillable showDelta />
    </>
  );

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-violet-50 to-indigo-50 border-l-4 border-violet-600 rounded-lg p-4 mb-6">
        <h2 className="text-base font-bold text-slate-900 mb-1">Execution vs Reliability Tradeoffs</h2>
        <p className="text-xs text-slate-600">
          <strong>Plane A (Execution):</strong> Base generation cost. <strong>Plane B (Diagnostics):</strong> Runtime validation overhead (non-billable; active in governed and hybrid modes). <strong>Plane C (Repairs):</strong> Conditional recovery cost.
          <span className="block mt-1 text-violet-700 font-semibold">Governance increases base execution cost and adds validation overhead, but reduces the risk of invalid or unstable outputs and controls recovery through structured repair and containment.</span>
        </p>
      </div>

      <PlaneTable
        title="Plane A: Execution"
        subtitle="Billable — Initial model call to generate response (no repairs)"
        rows={executionRows}
        bgColor="bg-violet-50"
      />

      <PlaneTable
        title="Plane B: Diagnostics"
        subtitle="Runtime validation overhead (non-billable; active in governed and hybrid modes)"
        rows={diagnosticsRows}
        bgColor="bg-blue-50"
      />

      <PlaneTable
        title="Plane C: Repairs"
        subtitle="Billable — Extra model calls + tokens only when validation fails. Not triggered on successful first attempt."
        rows={repairRows}
        bgColor="bg-amber-50"
      />

      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="py-4">
          <h3 className="text-sm font-bold text-slate-800 mb-3">Execution Activation Model</h3>
          <ul className="space-y-2 text-xs text-slate-700">
            <li>• Plane A always runs (base execution)</li>
            <li>• Plane B runs in governed and hybrid modes (runtime validation, non-billable)</li>
            <li>• Plane C runs only when validation fails (repairs are billable)</li>
            <li>• Safe mode applies if repairs cannot satisfy the contract</li>
            <li>• Hybrid can reuse experience (context) to reduce tokens on repeats</li>
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
                      {allModeMetrics?.governed?.audit?.duration_ms || allModeMetrics?.hybrid?.audit?.duration_ms} ms
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