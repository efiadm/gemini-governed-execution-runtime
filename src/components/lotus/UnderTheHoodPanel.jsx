import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, AlertTriangle, Clock, Zap, TrendingUp, Activity } from "lucide-react";
import { subscribeToRunState, getRunState } from "./runStore";

export default function UnderTheHoodPanel() {
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
        <p className="text-sm text-slate-400 italic">No run data. Execute a prompt to see Under the Hood metrics.</p>
      </div>
    );
  }

  const { mode, validation, performance, drift, hallucination, evidence } = runState;
  const perf = performance?.[mode] || {};

  return (
    <div className="space-y-6">
      {/* Compact Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-2">
              <Clock className="w-3 h-3" />
              Latency
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-bold text-slate-900">{perf.total_latency_ms || 0}ms</p>
            <div className="text-[10px] text-slate-500 space-y-0.5 mt-1">
              <div>Model (billable): {perf.total_model_latency_ms || 0}ms</div>
              <div>Runtime-local: {perf.total_local_latency_ms || 0}ms</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-2">
              <Zap className="w-3 h-3" />
              Tokens
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-bold text-slate-900">{perf.total_model_tokens || 0}</p>
            <div className="text-[10px] text-slate-500 space-y-0.5 mt-1">
              <div>In: {perf.prompt_tokens || 0}</div>
              <div>Out: {perf.completion_tokens || 0}</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-2">
              <Activity className="w-3 h-3" />
              Validation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 mb-2">
              {validation.passed ? (
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              ) : validation.passed === null ? (
                <span className="text-xs text-slate-400">N/A</span>
              ) : (
                <XCircle className="w-5 h-5 text-red-500" />
              )}
            </div>
            <div className="text-[10px] text-slate-500 space-y-0.5">
              <div>Attempts: {validation.attempts || 0}</div>
              <div>Repairs: {validation.repairs || 0}</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-2">
              <TrendingUp className="w-3 h-3" />
              Risk
            </CardTitle>
          </CardHeader>
          <CardContent>
            {hallucination?.risk ? (
              <>
                <Badge className={`text-xs ${
                  hallucination.risk === "HIGH" ? "bg-red-600" :
                  hallucination.risk === "MEDIUM" ? "bg-yellow-600" :
                  "bg-green-600"
                }`}>
                  {hallucination.risk}
                </Badge>
                <div className="text-[10px] text-slate-500 mt-2">
                  Drift: {drift?.stability_score !== null ? (drift.stability_score * 100).toFixed(0) + "%" : "N/A"}
                </div>
              </>
            ) : (
              <p className="text-xs text-slate-400">N/A</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Invariants & Governance Checks */}
      <Card className="border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-slate-700">Invariants & Governance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 bg-slate-50 rounded">
                <span className="text-slate-600">Contract Applied:</span>
                <Badge variant={mode !== "baseline" ? "default" : "outline"}>
                  {mode !== "baseline" ? "Yes" : "No"}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-2 bg-slate-50 rounded">
                <span className="text-slate-600">Safe Mode:</span>
                <Badge variant={evidence?.safe_mode_applied ? "destructive" : "outline"}>
                  {evidence?.safe_mode_applied ? "Applied" : "No"}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-2 bg-slate-50 rounded">
                <span className="text-slate-600">Grounding:</span>
                <Badge variant="outline">{evidence?.grounding || "off"}</Badge>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 bg-slate-50 rounded">
                <span className="text-slate-600">Authority Flags:</span>
                <span className="font-mono text-slate-800">{drift?.authority_drift_flags?.total || 0}</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-slate-50 rounded">
                <span className="text-slate-600">Structure Score:</span>
                <span className="font-mono text-slate-800">
                  {drift?.structure_drift !== null ? drift.structure_drift + "%" : "N/A"}
                </span>
              </div>
              <div className="flex items-center justify-between p-2 bg-slate-50 rounded">
                <span className="text-slate-600">Hybrid Context:</span>
                <Badge variant="outline">
                  {evidence?.hybrid_context_injected ? "Injected" : "No"}
                </Badge>
              </div>
            </div>
          </div>

          {validation.errors && validation.errors.length > 0 && (
            <div className="border-l-4 border-amber-500 bg-amber-50 p-3 rounded">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-amber-700" />
                <span className="text-xs font-semibold text-amber-800">Validation Errors</span>
              </div>
              <ul className="text-xs text-amber-700 space-y-1 ml-6 list-disc">
                {validation.errors.slice(0, 3).map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Telemetry Details */}
      {(drift || hallucination) && (
        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-slate-700">Telemetry Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {drift && (
              <div>
                <h4 className="text-xs font-semibold text-slate-600 mb-2">Drift Analysis</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 bg-slate-50 rounded">
                    <span className="text-slate-500 block mb-1">Stability Score:</span>
                    <span className="font-mono text-slate-900">
                      {drift.stability_score !== null ? (drift.stability_score * 100).toFixed(1) + "%" : "N/A"}
                    </span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded">
                    <span className="text-slate-500 block mb-1">Output Hash:</span>
                    <span className="font-mono text-xs text-slate-700">
                      {drift.output_hash?.substring(0, 12) || "N/A"}...
                    </span>
                  </div>
                </div>
              </div>
            )}

            {hallucination && (
              <div>
                <h4 className="text-xs font-semibold text-slate-600 mb-2">Citation Integrity</h4>
                <div className="space-y-2 text-xs">
                  {hallucination.citationIntegrity?.uncitedLinks?.length > 0 && (
                    <div className="p-2 bg-red-50 rounded border border-red-200">
                      <span className="text-red-700 font-medium">
                        {hallucination.citationIntegrity.uncitedLinks.length} uncited link(s)
                      </span>
                    </div>
                  )}
                  {hallucination.citationIntegrity?.placeholderLinks?.length > 0 && (
                    <div className="p-2 bg-red-50 rounded border border-red-200">
                      <span className="text-red-700 font-medium">
                        {hallucination.citationIntegrity.placeholderLinks.length} placeholder domain(s)
                      </span>
                    </div>
                  )}
                  {hallucination.citationIntegrity?.uncitedClaimsWarning && (
                    <div className="p-2 bg-amber-50 rounded border border-amber-200">
                      <span className="text-amber-700 font-medium">
                        Uncited claims with grounding=on
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Evidence Metadata */}
      <Card className="border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-slate-700">Evidence Metadata</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-slate-500">Request ID:</span>
              <p className="font-mono text-slate-800 text-[10px] break-all">{evidence?.request_id || "N/A"}</p>
            </div>
            <div>
              <span className="text-slate-500">Prompt Hash:</span>
              <p className="font-mono text-slate-800">{evidence?.prompt_hash || "N/A"}</p>
            </div>
            <div>
              <span className="text-slate-500">Timestamp:</span>
              <p className="text-slate-800">{evidence?.timestamp ? new Date(evidence.timestamp).toLocaleTimeString() : "N/A"}</p>
            </div>
            <div>
              <span className="text-slate-500">Mode:</span>
              <Badge variant="outline">{mode}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}