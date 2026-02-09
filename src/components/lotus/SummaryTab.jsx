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
        <p className="text-sm italic" style={{ color: '#8ea597' }}>No runs yet. Execute a prompt to see summary.</p>
      </div>
    );
  }

  const { mode, model, grounding, validation, performance } = runState;
  const baselinePerf = performance?.baseline || {};
  const currentPerf = performance?.[mode] || {};
  const hasBaseline = baselinePerf && baselinePerf.total_model_tokens;

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

  // Count how many lanes have complete data
  const lanesWithData = lanes.filter(lane => 
    performance?.[lane]?.total_model_tokens && performance?.[lane]?.total_model_latency_ms
  ).length;

  return (
    <div className="space-y-6">
      {/* Lane Comparison Table - only show if multiple lanes have data */}
      {lanesWithData >= 2 && (
        <Card style={{ backgroundColor: '#0f1512', borderColor: 'rgba(231, 240, 234, 0.10)', boxShadow: '0 1px 0 rgba(255,255,255,0.04) inset' }}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold" style={{ color: '#e7f0ea' }}>Lane Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <div className="min-w-[500px]">
                <div className="grid grid-cols-4 gap-2 text-xs">
                  <div className="font-semibold" style={{ color: '#8ea597' }}>Metric</div>
                  {lanes.map(lane => (
                    <div key={lane} className="font-semibold text-center p-2 rounded" style={{ backgroundColor: '#131b16', color: '#e7f0ea' }}>
                      {lane.charAt(0).toUpperCase() + lane.slice(1)}
                    </div>
                  ))}
              
              <div className="py-2" style={{ color: '#8ea597' }}>Tokens (billable)</div>
              {lanes.map(lane => (
                <div key={lane} className="text-center font-mono py-2">
                  {performance?.[lane]?.total_model_tokens || "—"}
                </div>
              ))}
              
              <div className="py-2" style={{ color: '#9aa1a9' }}>Model Time (billable)</div>
              {lanes.map(lane => (
                <div key={lane} className="text-center font-mono py-2" style={{ color: '#e6e8eb' }}>
                  {performance?.[lane]?.total_model_latency_ms || "—"}ms
                </div>
              ))}
              
              <div className="py-2" style={{ color: '#9aa1a9' }}>Runtime-local</div>
              {lanes.map(lane => (
                <div key={lane} className="text-center font-mono py-2" style={{ color: '#e6e8eb' }}>
                  {performance?.[lane]?.total_local_latency_ms || "—"}ms
                </div>
              ))}
              
              <div className="py-2" style={{ color: '#9aa1a9' }}>Repairs</div>
              {lanes.map(lane => (
                <div key={lane} className="text-center font-mono py-2">
                  {validation?.repairs || 0}
                </div>
              ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card style={{ backgroundColor: '#1a1f22', borderColor: '#2a3036' }}>
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-semibold uppercase" style={{ color: '#9aa1a9' }}>Run Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-xs">
              <span style={{ color: '#9aa1a9' }}>Mode:</span>
              <Badge variant="secondary">{mode}</Badge>
            </div>
            <div className="flex justify-between text-xs">
              <span style={{ color: '#9aa1a9' }}>Model:</span>
              <span className="font-mono" style={{ color: '#e6e8eb' }}>{model}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span style={{ color: '#9aa1a9' }}>Grounding:</span>
              <Badge variant="outline">{grounding}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card style={{ backgroundColor: '#0f1512', borderColor: 'rgba(231, 240, 234, 0.10)', boxShadow: '0 1px 0 rgba(255,255,255,0.04) inset' }}>
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-semibold uppercase" style={{ color: '#8ea597' }}>Validation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              {validation.passed ? (
                <CheckCircle2 className="w-5 h-5" style={{ color: '#3bd18a' }} />
              ) : validation.passed === null ? (
                <span className="text-xs" style={{ color: '#8ea597' }}>N/A (Baseline)</span>
              ) : (
                <XCircle className="w-5 h-5" style={{ color: '#f26b6b' }} />
              )}
              <span className="text-sm font-medium" style={{ color: '#e7f0ea' }}>
                {validation.passed ? "Passed" : validation.passed === null ? "Not Applicable" : "Failed"}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span style={{ color: '#8ea597' }}>Attempts:</span>
                <p className="font-bold" style={{ color: '#e7f0ea' }}>{validation.attempts}</p>
              </div>
              <div>
                <span style={{ color: '#8ea597' }}>Repairs:</span>
                <p className="font-bold" style={{ color: '#e7f0ea' }}>{validation.repairs}</p>
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

        {mode !== "baseline" && validation.repairs > 0 && hasBaseline && (
          <Card style={{ backgroundColor: '#1a1f22', borderColor: '#2a3036' }}>
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-semibold uppercase" style={{ color: '#9aa1a9' }}>Conditional Overhead</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-[10px] mb-3" style={{ color: '#9aa1a9' }}>Overhead incurs only when validation fails and recovery path activates.</p>
              <div className="flex justify-between text-xs">
                <span style={{ color: '#9aa1a9' }}>Δ Tokens:</span>
                <div className="flex items-center gap-1">
                  {getDelta(currentPerf.total_model_tokens, baselinePerf.total_model_tokens) > 0 ? (
                    <ArrowUp className="w-3 h-3 text-orange-600" />
                  ) : (
                    <ArrowDown className="w-3 h-3 text-blue-600" />
                  )}
                  <span className={`font-mono ${getDelta(currentPerf.total_model_tokens, baselinePerf.total_model_tokens) > 0 ? 'text-orange-600' : 'text-blue-600'}`}>
                    {Math.abs(getDelta(currentPerf.total_model_tokens, baselinePerf.total_model_tokens) || 0)}
                  </span>
                </div>
              </div>
              <div className="flex justify-between text-xs">
                <span style={{ color: '#9aa1a9' }}>Δ Latency:</span>
                <div className="flex items-center gap-1">
                  {getDelta(currentPerf.total_latency_ms, baselinePerf.total_latency_ms) > 0 ? (
                    <ArrowUp className="w-3 h-3 text-orange-600" />
                  ) : (
                    <ArrowDown className="w-3 h-3 text-blue-600" />
                  )}
                  <span className={`font-mono ${getDelta(currentPerf.total_latency_ms, baselinePerf.total_latency_ms) > 0 ? 'text-orange-600' : 'text-blue-600'}`}>
                    {Math.abs(getDelta(currentPerf.total_latency_ms, baselinePerf.total_latency_ms) || 0)}ms
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {runState.artifacts && runState.artifacts.length > 0 && (
        <Card style={{ backgroundColor: '#0f1512', borderColor: 'rgba(231, 240, 234, 0.10)', boxShadow: '0 1px 0 rgba(255,255,255,0.04) inset' }}>
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-semibold uppercase" style={{ color: '#8ea597' }}>Recent Artifacts</CardTitle>
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