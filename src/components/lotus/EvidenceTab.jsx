import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Clock, ChevronDown, ChevronRight } from "lucide-react";


export default function EvidenceTab({ evidence, mode, onRunBaseline }) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  if (!evidence) {
    return (
      <p className="text-sm text-muted-foreground italic">No evidence data. Run a prompt to see details.</p>
    );
  }

  if (evidence.error) {
    return (
      <Card className="border-destructive bg-destructive/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-destructive">Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">{evidence.error_message}</p>
          <p className="text-xs text-destructive mt-2">Code: {evidence.error_code}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="surface">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-card-foreground">Request Metadata</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-xs">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-muted-foreground">Request ID:</span>
              <p className="font-mono text-foreground">{evidence.request_id}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Timestamp:</span>
              <p className="text-foreground">{new Date(evidence.timestamp).toLocaleString()}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Mode:</span>
              <p className="text-foreground">{evidence.mode}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Model:</span>
              <p className="text-foreground">{evidence.model}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Grounding:</span>
              <p className="text-foreground">{evidence.grounding}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Prompt Hash:</span>
              <p className="font-mono text-foreground">{evidence.prompt_hash?.substring(0, 16)}</p>
            </div>
          </div>
          <div>
            <span className="text-muted-foreground">Prompt Preview:</span>
            <p className="text-foreground bg-muted p-2 rounded mt-1">{evidence.prompt_preview}</p>
          </div>
        </CardContent>
      </Card>

      {evidence.attemptDetails && evidence.attemptDetails.length > 0 && (
        <Card className="surface">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-card-foreground">Attempt History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {evidence.attemptDetails.map((att, i) => (
                <div key={i} className="border border-border rounded-lg p-3 space-y-2 bg-muted/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {att.ok ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-destructive" />
                      )}
                      <span className="text-xs font-medium text-foreground">
                        Attempt {att.attempt} ({att.kind})
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span title="Billable model time">Model: {att.model_ms}ms</span>
                      <span title="App runtime (non-billable)">App: {att.local_ms}ms</span>
                    </div>
                  </div>
                  {att.errors && att.errors.length > 0 && (
                    <div className="space-y-1">
                      {att.errors.map((err, j) => (
                        <p key={j} className="text-xs text-destructive bg-destructive/20 p-2 rounded border border-destructive">{err}</p>
                      ))}
                    </div>
                  )}
                  <details className="text-xs">
                    <summary className="text-muted-foreground cursor-pointer hover:text-foreground flex items-center justify-between">
                      <span>Raw preview</span>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const json = JSON.stringify(att, null, 2);
                          navigator.clipboard.writeText(json);
                          import("sonner").then(({ toast }) => toast.success("Attempt JSON copied"));
                        }}
                        className="text-accent hover:underline"
                      >
                        Copy Attempt JSON
                      </button>
                    </summary>
                    <pre className="bg-background text-foreground border border-border p-2 rounded mt-2 text-[10px] overflow-auto max-h-[200px]">
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
      <Card className={`surface ${evidence.safe_mode_applied ? "border-green-500 bg-green-900/10" : ""}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-card-foreground">Validation Summary</CardTitle>
        {evidence.safe_mode_applied && (
          <p className="text-xs text-green-400 mt-2">Model could not satisfy contract within repair cap. Output integrity preserved through model-limited execution.</p>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 gap-3 text-xs">
          <div className="bg-muted rounded p-2 text-center">
            <p className="text-muted-foreground">Total</p>
            <p className="text-lg font-bold text-foreground">{evidence.validation_summary.total_checks}</p>
          </div>
          <div className={`rounded p-2 text-center ${evidence.safe_mode_applied ? "bg-amber-900/20 border border-amber-500" : "bg-green-900/20 border border-green-500"}`}>
            <p className={evidence.safe_mode_applied ? "text-amber-400" : "text-green-400"}>Passed</p>
            <p className={`text-lg font-bold ${evidence.safe_mode_applied ? "text-amber-300" : "text-green-300"}`}>{evidence.validation_summary.passed_checks}</p>
          </div>
          <div className={`rounded p-2 text-center ${evidence.safe_mode_applied ? "bg-green-900/20 border border-green-500" : "bg-destructive/20 border border-destructive"}`}>
            <p className={evidence.safe_mode_applied ? "text-green-400" : "text-destructive"}>Status</p>
            <p className={`text-lg font-bold ${evidence.safe_mode_applied ? "text-green-300" : "text-destructive"}`}>{evidence.safe_mode_applied ? "Contained" : "Failed"}</p>
          </div>
        </div>
            {evidence.validation_summary.failures && evidence.validation_summary.failures.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-foreground">Failures:</p>
                {evidence.validation_summary.failures.map((f, i) => (
                  <p key={i} className="text-xs text-destructive bg-destructive/20 p-2 rounded border border-destructive">{f}</p>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}


    </div>
  );
}