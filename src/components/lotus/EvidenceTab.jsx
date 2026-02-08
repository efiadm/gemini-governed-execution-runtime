import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Clock, ChevronDown, ChevronRight } from "lucide-react";
import BaselineDeltaPanel from "./BaselineDeltaPanel";

export default function EvidenceTab({ evidence, mode, onRunBaseline }) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  if (!evidence) {
    return (
      <>
        <p className="text-sm text-slate-400 italic">No evidence data. Run a prompt to see details.</p>
        
        <Card className="border-slate-200 bg-slate-50 mt-4">
          <CardHeader className="pb-2">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-slate-900 w-full"
            >
              {showAdvanced ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              Advanced Diagnostics
            </button>
          </CardHeader>
          {showAdvanced && (
            <CardContent>
              <p className="text-xs text-slate-500 italic">
                Baseline comparison metrics. Requires a baseline run for the same prompt/model/grounding.
              </p>
            </CardContent>
          )}
        </Card>
      </>
    );
  }

  if (evidence.error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-red-800">Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-700">{evidence.error_message}</p>
          <p className="text-xs text-red-600 mt-2">Code: {evidence.error_code}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-slate-700">Request Metadata</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-xs">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-slate-500">Request ID:</span>
              <p className="font-mono text-slate-800">{evidence.request_id}</p>
            </div>
            <div>
              <span className="text-slate-500">Timestamp:</span>
              <p className="text-slate-800">{new Date(evidence.timestamp).toLocaleString()}</p>
            </div>
            <div>
              <span className="text-slate-500">Mode:</span>
              <p className="text-slate-800">{evidence.mode}</p>
            </div>
            <div>
              <span className="text-slate-500">Model:</span>
              <p className="text-slate-800">{evidence.model}</p>
            </div>
            <div>
              <span className="text-slate-500">Grounding:</span>
              <p className="text-slate-800">{evidence.grounding}</p>
            </div>
            <div>
              <span className="text-slate-500">Prompt Hash:</span>
              <p className="font-mono text-slate-800">{evidence.prompt_hash?.substring(0, 16)}</p>
            </div>
          </div>
          <div>
            <span className="text-slate-500">Prompt Preview:</span>
            <p className="text-slate-700 bg-slate-50 p-2 rounded mt-1">{evidence.prompt_preview}</p>
          </div>
        </CardContent>
      </Card>

      {evidence.attemptDetails && evidence.attemptDetails.length > 0 && (
        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-slate-700">Attempt History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {evidence.attemptDetails.map((att, i) => (
                <div key={i} className="border border-slate-200 rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {att.ok ? (
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )}
                      <span className="text-xs font-medium text-slate-700">
                        Attempt {att.attempt} ({att.kind})
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span title="Billable model time">Model: {att.model_ms}ms</span>
                      <span title="App runtime (non-billable)">App: {att.local_ms}ms</span>
                    </div>
                  </div>
                  {att.errors && att.errors.length > 0 && (
                    <div className="space-y-1">
                      {att.errors.map((err, j) => (
                        <p key={j} className="text-xs text-red-700 bg-red-50 p-2 rounded">{err}</p>
                      ))}
                    </div>
                  )}
                  <details className="text-xs">
                    <summary className="text-slate-600 cursor-pointer hover:text-slate-800 flex items-center justify-between">
                      <span>Raw preview</span>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const json = JSON.stringify(att, null, 2);
                          navigator.clipboard.writeText(json);
                          import("sonner").then(({ toast }) => toast.success("Attempt JSON copied"));
                        }}
                        className="text-blue-600 hover:underline"
                      >
                        Copy Attempt JSON
                      </button>
                    </summary>
                    <pre className="bg-slate-900 text-slate-100 p-2 rounded mt-2 text-[10px] overflow-auto max-h-[200px]">
                      {att.raw_full || att.raw_preview}
                    </pre>
                  </details>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {evidence.validation_summary && (
      <Card className={`border-slate-200 ${evidence.safe_mode_applied ? "border-green-200 bg-green-50" : ""}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-slate-700">Validation Summary</CardTitle>
        {evidence.safe_mode_applied && (
          <p className="text-xs text-green-700 mt-2">Contract not satisfied within repair cap; output contained to prevent drift.</p>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 gap-3 text-xs">
          <div className="bg-slate-50 rounded p-2 text-center">
            <p className="text-slate-500">Total</p>
            <p className="text-lg font-bold text-slate-900">{evidence.validation_summary.total_checks}</p>
          </div>
          <div className={`rounded p-2 text-center ${evidence.safe_mode_applied ? "bg-orange-50" : "bg-green-50"}`}>
            <p className={evidence.safe_mode_applied ? "text-orange-600" : "text-green-600"}>Passed</p>
            <p className={`text-lg font-bold ${evidence.safe_mode_applied ? "text-orange-700" : "text-green-700"}`}>{evidence.validation_summary.passed_checks}</p>
          </div>
          <div className={`rounded p-2 text-center ${evidence.safe_mode_applied ? "bg-green-50" : "bg-red-50"}`}>
            <p className={evidence.safe_mode_applied ? "text-green-600" : "text-red-600"}>Status</p>
            <p className={`text-lg font-bold ${evidence.safe_mode_applied ? "text-green-700" : "text-red-700"}`}>{evidence.safe_mode_applied ? "Contained" : "Failed"}</p>
          </div>
        </div>
            {evidence.validation_summary.failures && evidence.validation_summary.failures.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-slate-700">Failures:</p>
                {evidence.validation_summary.failures.map((f, i) => (
                  <p key={i} className="text-xs text-red-700 bg-red-50 p-2 rounded">{f}</p>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card className="border-slate-200 bg-slate-50 mt-4">
        <CardHeader className="pb-2">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-slate-900 w-full"
          >
            {showAdvanced ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            Advanced Diagnostics
          </button>
        </CardHeader>
        {showAdvanced && (
          <CardContent>
            <p className="text-xs text-slate-500 mb-4 italic">
              Baseline comparison metrics. Requires a baseline run for the same prompt/model/grounding.
            </p>
            {mode !== "baseline" && onRunBaseline && (
              <BaselineDeltaPanel onRunBaseline={onRunBaseline} />
            )}
            {mode === "baseline" && (
              <p className="text-xs text-slate-400 italic">Not available in baseline mode.</p>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
}