import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, AlertTriangle, Clock, Zap, ArrowUp, ArrowDown } from "lucide-react";
import { subscribeToRunState, getRunState } from "./runStore";

export default function SummaryTab() {
  const [runState, setRunState] = useState(getRunState());

  useEffect(() => {
    const unsubscribe = subscribeToRunState((state) => {
      setRunState(state);
    });
    return unsubscribe;
  }, []);

  if (!runState.run_id) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-slate-400 italic">No runs yet. Execute a prompt to see summary.</p>
      </div>
    );
  }

  const { mode, model, grounding, validation, performance } = runState;
  const baselinePerf = performance?.baseline || {};
  const currentPerf = performance?.[mode] || {};

  const getDelta = (current, baseline) => {
    if (!current || !baseline) return null;
    return current - baseline;
  };

  const lanes = ["baseline", "governed", "hybrid"];
  const laneColors = {
    baseline: "bg-slate-100",
    governed: "bg-blue-50",
    hybrid: "bg-purple-50",
  };

  return (
    <div className="space-y-6">
      {/* Lane Comparison Table */}
      <Card className="border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-slate-700">Lane Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-2 text-xs">
            <div className="font-semibold text-slate-600">Metric</div>
            {lanes.map(lane => (
              <div key={lane} className={`font-semibold text-slate-700 text-center p-2 rounded ${laneColors[lane]}`}>
                {lane.charAt(0).toUpperCase() + lane.slice(1)}
              </div>
            ))}
            
            <div className="text-slate-600 py-2">Tokens (billable)</div>
            {lanes.map(lane => (
              <div key={lane} className="text-center font-mono py-2">
                {performance?.[lane]?.total_model_tokens || "—"}
              </div>
            ))}
            
            <div className="text-slate-600 py-2">Model Time (billable)</div>
            {lanes.map(lane => (
              <div key={lane} className="text-center font-mono py-2">
                {performance?.[lane]?.total_model_latency_ms || "—"}ms
              </div>
            ))}
            
            <div className="text-slate-600 py-2">App Runtime (non-billable)</div>
            {lanes.map(lane => (
              <div key={lane} className="text-center font-mono py-2">
                {performance?.[lane]?.total_local_latency_ms || "—"}ms
              </div>
            ))}
            
            <div className="text-slate-600 py-2">Repairs</div>
            {lanes.map(lane => (
              <div key={lane} className="text-center font-mono py-2">
                {validation[lane]?.repairs || 0}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase">Run Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-600">Mode:</span>
              <Badge variant="secondary">{mode}</Badge>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-600">Model:</span>
              <span className="font-mono text-slate-800">{model}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-600">Grounding:</span>
              <Badge variant="outline">{grounding}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase">Validation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              {validation.passed ? (
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              ) : validation.passed === null ? (
                <span className="text-xs text-slate-400">N/A (Baseline)</span>
              ) : (
                <XCircle className="w-5 h-5 text-red-500" />
              )}
              <span className="text-sm font-medium text-slate-700">
                {validation.passed ? "Passed" : validation.passed === null ? "Not Applicable" : "Failed"}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-600">Attempts:</span>
                <p className="font-bold text-slate-900">{validation.attempts}</p>
              </div>
              <div>
                <span className="text-slate-600">Repairs:</span>
                <p className="font-bold text-slate-900">{validation.repairs}</p>
              </div>
            </div>
            {validation.errors && validation.errors.length > 0 && (
              <div className="flex items-center gap-1 text-xs text-red-600">
                <AlertTriangle className="w-3 h-3" />
                <span>{validation.errors.length} errors</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase">Performance Δ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {mode !== "baseline" && baselinePerf.total_model_tokens ? (
              <>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-600">Δ Tokens:</span>
                  <div className="flex items-center gap-1">
                    {getDelta(currentPerf.total_model_tokens, baselinePerf.total_model_tokens) > 0 ? (
                      <ArrowUp className="w-3 h-3 text-red-600" />
                    ) : (
                      <ArrowDown className="w-3 h-3 text-green-600" />
                    )}
                    <span className={`font-mono ${getDelta(currentPerf.total_model_tokens, baselinePerf.total_model_tokens) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {Math.abs(getDelta(currentPerf.total_model_tokens, baselinePerf.total_model_tokens) || 0)}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-600">Δ Latency:</span>
                  <div className="flex items-center gap-1">
                    {getDelta(currentPerf.total_latency_ms, baselinePerf.total_latency_ms) > 0 ? (
                      <ArrowUp className="w-3 h-3 text-red-600" />
                    ) : (
                      <ArrowDown className="w-3 h-3 text-green-600" />
                    )}
                    <span className={`font-mono ${getDelta(currentPerf.total_latency_ms, baselinePerf.total_latency_ms) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {Math.abs(getDelta(currentPerf.total_latency_ms, baselinePerf.total_latency_ms) || 0)}ms
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-xs text-slate-400 italic">Run baseline first for comparison</p>
            )}
          </CardContent>
        </Card>
      </div>

      {runState.artifacts && runState.artifacts.length > 0 && (
        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase">Recent Artifacts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 flex-wrap">
              {runState.artifacts.slice(-5).map((art, i) => (
                <Badge key={i} variant="outline" className="text-xs">
                  {art.type}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}