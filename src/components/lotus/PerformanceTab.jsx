import React, { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUp, ArrowDown } from "lucide-react";

export default function PerformanceTab({ allModeMetrics, baselineMetrics }) {
  const [showOnlyBillable, setShowOnlyBillable] = useState(false);

  if (!allModeMetrics || Object.keys(allModeMetrics).length === 0) {
    return <p className="text-sm text-muted-foreground italic">No performance data yet. Run tests to see metrics.</p>;
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
  
  const formatCurrency = (cost) => {
    if (typeof cost !== "number") return cost;
    return `$${cost.toFixed(4)}`;
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
    
    const formatValue = (val) => {
      if (val == null || val === undefined) return "—";
      if (typeof val === "string") return val;
      return val;
    };
    
    const canShowDelta = (base, comp) => {
      return base != null && comp != null && typeof base === "number" && typeof comp === "number";
    };
    
    return (
      <TableRow>
        <TableCell className="text-xs font-medium text-foreground">
          {label}
          {isBillable && <Badge className="ml-2 bg-destructive text-destructive-foreground text-[9px]">Billable</Badge>}
        </TableCell>
        <TableCell className="text-center text-xs font-mono">
          {formatValue(baseVal)}{typeof baseVal === "number" ? unit : ""}
        </TableCell>
        <TableCell className="text-center text-xs">
          <div className="flex items-center justify-center gap-1">
            <span className="font-mono">{formatValue(govVal)}{typeof govVal === "number" ? unit : ""}</span>
            {showDelta && canShowDelta(baseVal, govVal) && (
              <span className={`text-[10px] ${getDelta(govVal, baseVal) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {getDelta(govVal, baseVal) > 0 ? <ArrowUp className="w-3 h-3 inline" /> : <ArrowDown className="w-3 h-3 inline" />}
                {Math.abs(getDelta(govVal, baseVal)).toFixed(0)}
              </span>
            )}
          </div>
        </TableCell>
        <TableCell className="text-center text-xs">
          <div className="flex items-center justify-center gap-1">
            <span className="font-mono">{formatValue(hybVal)}{typeof hybVal === "number" ? unit : ""}</span>
            {showDelta && canShowDelta(baseVal, hybVal) && (
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

  const PlaneTable = ({ title, subtitle, rows, bgColor = "bg-muted" }) => (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
        </div>
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-[700px]">
          <div className="border border-border rounded-lg overflow-hidden">
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
        return m?.total?.base_model_latency_ms ?? m?.total?.model_latency_ms ?? 0;
      }} unit="ms" isBillable showDelta />
      <MetricRow label="Base Tokens (pre-repair)" getValue={(m) => {
        const total = m?.billable?.total_model_tokens ?? 0;
        const extra = m?.repair?.extra_tokens_due_to_repair ?? 0;
        return Math.max(0, total - extra);
      }} isBillable showDelta />
      <MetricRow label="Estimated Cost" getValue={(m) => {
        const total = m?.billable?.total_model_tokens ?? 0;
        const extra = m?.repair?.extra_tokens_due_to_repair ?? 0;
        const cost = calculateCost(Math.max(0, total - extra));
        return formatCurrency(cost);
      }} isBillable />
      <MetricRow label="Efficiency (tok/sec)" getValue={(m) => {
        const score = calculateEfficiencyScore(m);
        return score ?? 0;
      }} />
    </>
  );

  const diagnosticsRows = (
    <>
      <MetricRow label="Validation Time" getValue={(m) => m?.local?.local_validation_ms ?? 0} unit="ms" />
      <MetricRow label="Render Time" getValue={(m) => m?.local?.local_render_ms ?? 0} unit="ms" />
      <MetricRow label="Evidence Assembly" getValue={(m) => {
        const total = m?.local?.total_local_ms ?? 0;
        const validation = m?.local?.local_validation_ms ?? 0;
        const render = m?.local?.local_render_ms ?? 0;
        return Math.max(0, total - validation - render);
      }} unit="ms" />
      <MetricRow label="Total Runtime-local" getValue={(m) => m?.local?.total_local_ms ?? 0} unit="ms" showDelta />
    </>
  );

  const repairRows = (
    <>
      <MetricRow label="Extra Model Calls" getValue={(m) => m?.repair?.extra_model_calls_due_to_repair ?? 0} isBillable showDelta />
      <MetricRow label="Extra Tokens (repairs)" getValue={(m) => m?.repair?.extra_tokens_due_to_repair ?? 0} isBillable showDelta />
      <MetricRow label="Repair Latency (model)" getValue={(m) => {
        return m?.repair?.repair_model_latency_ms ?? 0;
      }} unit="ms" isBillable showDelta />
      <MetricRow label="Repair Cost" getValue={(m) => {
        const extra = m?.repair?.extra_tokens_due_to_repair ?? 0;
        const cost = calculateCost(extra);
        return formatCurrency(cost);
      }} isBillable />
    </>
  );

  return (
    <div className="space-y-6">
      <div className="bg-card border-l-4 border-primary rounded-lg p-4 mb-6">
        <h2 className="text-base font-bold text-foreground mb-1">Execution vs Reliability Tradeoffs</h2>
        <p className="text-xs text-muted-foreground">
          <strong>Plane A (Execution):</strong> Base generation cost. <strong>Plane B (Diagnostics):</strong> Optional validation overhead. <strong>Plane C (Repairs):</strong> Conditional recovery cost. 
          <span className="block mt-1 text-primary font-semibold">Governance increases base execution cost but reduces downstream reliability and recovery costs by preventing invalid or unstable outputs.</span>
        </p>
      </div>

      <PlaneTable
        title="🚀 Plane A: Execution (Base Generation)"
        subtitle="💵 Billable — Initial model call to generate response (no repairs)"
        rows={executionRows}
        bgColor="bg-muted"
      />

      <PlaneTable
        title="🔍 Plane B: Diagnostics (Runtime-Local)"
        subtitle="⚙️ Non-Billable — Browser-side validation, parsing, evidence assembly. Activates in governed/hybrid modes."
        rows={diagnosticsRows}
        bgColor="bg-muted"
      />

      <PlaneTable
        title="🔧 Plane C: Repairs (Recovery Calls)"
        subtitle="💵 Billable — Extra model calls + tokens only when validation fails. Not triggered on successful first attempt."
        rows={repairRows}
        bgColor="bg-muted"
      />

      <Card className="border-border bg-card">
        <CardContent className="py-4">
          <h3 className="text-sm font-bold text-foreground mb-3">Conditional Activation Model</h3>
          <p className="text-xs text-muted-foreground mb-3">
            <strong>Plane C (Repairs) activates only on validation failure.</strong> When validation passes on first attempt, governed and hybrid modes incur Plane A + Plane B costs only — comparable to baseline with added contract guarantees and auditability.
          </p>
          <ul className="space-y-2 text-xs text-muted-foreground">
            <li>• <strong>Best case (validation passes):</strong> Plane A (base execution) + Plane B (runtime validation) — no repairs triggered</li>
            <li>• <strong>Recovery case (validation fails):</strong> Plane C activates — extra model calls until contract satisfied or safe mode applied</li>
            <li>• <strong>Safe Mode containment:</strong> When contract remains unsatisfiable after repairs, output is withheld — correct governance outcome</li>
            <li>• <strong>Experience accumulation (Hybrid):</strong> Context injection from artifact store reduces token usage in repeat scenarios</li>
          </ul>
        </CardContent>
      </Card>

      {hasAuditData && (
        <div className="border-t-4 border-primary pt-6 mt-8">
          <div className="bg-card border-l-4 border-primary rounded-lg p-4 mb-4">
            <h2 className="text-base font-bold text-foreground mb-1">Diagnostics (Optional / Non-Default)</h2>
            <p className="text-xs text-muted-foreground">
              <strong>Post-execution analysis:</strong> Async audits run after response returned. <strong className="text-primary">Not included in execution latency or billable metrics.</strong> Enable in settings if needed.
            </p>
          </div>
          <h3 className="text-sm font-semibold text-foreground mb-3">Audit Path Metrics</h3>
          <Card className="border-border bg-card">
            <CardContent className="py-4">
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Audit Status:</span>
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
                    <span className="text-muted-foreground">Audit Duration:</span>
                    <span className="font-mono text-foreground">
                      {allModeMetrics?.governed?.audit?.duration_ms || allModeMetrics?.hybrid?.audit?.duration_ms}ms
                    </span>
                  </div>
                )}
                {(allModeMetrics?.governed?.audit?.depth || allModeMetrics?.hybrid?.audit?.depth) && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Audit Depth:</span>
                    <span className="text-foreground">
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