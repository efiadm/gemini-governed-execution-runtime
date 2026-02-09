import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Clock, ChevronDown, ChevronRight } from "lucide-react";


export default function EvidenceTab({ evidence, mode, onRunBaseline }) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  if (!evidence) {
    return (
      <p className="text-sm italic" style={{ color: '#8ea597' }}>No evidence data. Run a prompt to see details.</p>
    );
  }

  if (evidence.error) {
    return (
      <Card style={{ backgroundColor: 'rgba(242,107,107,0.14)', borderColor: 'rgba(242,107,107,0.28)' }}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold" style={{ color: '#f26b6b' }}>Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm" style={{ color: '#f26b6b' }}>{evidence.error_message}</p>
          <p className="text-xs mt-2" style={{ color: '#f26b6b' }}>Code: {evidence.error_code}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card style={{ backgroundColor: '#0f1512', borderColor: 'rgba(231, 240, 234, 0.10)', boxShadow: '0 1px 0 rgba(255,255,255,0.04) inset' }}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold" style={{ color: '#e7f0ea' }}>Request Metadata</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-xs">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span style={{ color: '#8ea597' }}>Request ID:</span>
              <p className="font-mono" style={{ color: '#e7f0ea' }}>{evidence.request_id}</p>
            </div>
            <div>
              <span style={{ color: '#8ea597' }}>Timestamp:</span>
              <p style={{ color: '#e7f0ea' }}>{new Date(evidence.timestamp).toLocaleString()}</p>
            </div>
            <div>
              <span style={{ color: '#8ea597' }}>Mode:</span>
              <p style={{ color: '#e7f0ea' }}>{evidence.mode}</p>
            </div>
            <div>
              <span style={{ color: '#8ea597' }}>Model:</span>
              <p style={{ color: '#e7f0ea' }}>{evidence.model}</p>
            </div>
            <div>
              <span style={{ color: '#8ea597' }}>Grounding:</span>
              <p style={{ color: '#e7f0ea' }}>{evidence.grounding}</p>
            </div>
            <div>
              <span style={{ color: '#8ea597' }}>Prompt Hash:</span>
              <p className="font-mono" style={{ color: '#e7f0ea' }}>{evidence.prompt_hash?.substring(0, 16)}</p>
            </div>
          </div>
          <div>
            <span style={{ color: '#8ea597' }}>Prompt Preview:</span>
            <p className="p-2 rounded mt-1" style={{ color: '#c7d6cc', backgroundColor: '#131b16' }}>{evidence.prompt_preview}</p>
          </div>
        </CardContent>
      </Card>

      {evidence.attemptDetails && evidence.attemptDetails.length > 0 && (
        <Card style={{ backgroundColor: '#0f1512', borderColor: 'rgba(231, 240, 234, 0.10)', boxShadow: '0 1px 0 rgba(255,255,255,0.04) inset' }}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold" style={{ color: '#e7f0ea' }}>Attempt History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {evidence.attemptDetails.map((att, i) => (
                <div key={i} className="rounded-lg p-3 space-y-2" style={{ border: '1px solid rgba(231, 240, 234, 0.10)', backgroundColor: '#131b16' }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {att.ok ? (
                        <CheckCircle2 className="w-4 h-4" style={{ color: '#3bd18a' }} />
                      ) : (
                        <XCircle className="w-4 h-4" style={{ color: '#f26b6b' }} />
                      )}
                      <span className="text-xs font-medium" style={{ color: '#e7f0ea' }}>
                        Attempt {att.attempt} ({att.kind})
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs" style={{ color: '#8ea597' }}>
                      <span title="Billable model time">Model: {att.model_ms}ms</span>
                      <span title="App runtime (non-billable)">App: {att.local_ms}ms</span>
                    </div>
                  </div>
                  {att.errors && att.errors.length > 0 && (
                    <div className="space-y-1">
                      {att.errors.map((err, j) => (
                        <p key={j} className="text-xs p-2 rounded" style={{ color: '#f26b6b', backgroundColor: 'rgba(242,107,107,0.14)' }}>{err}</p>
                      ))}
                    </div>
                  )}
                  <details className="text-xs">
                    <summary className="cursor-pointer flex items-center justify-between" style={{ color: '#8ea597' }}>
                      <span>Raw preview</span>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const json = JSON.stringify(att, null, 2);
                          navigator.clipboard.writeText(json);
                          import("sonner").then(({ toast }) => toast.success("Attempt JSON copied"));
                        }}
                        style={{ color: '#2db37a' }}
                      >
                        Copy Attempt JSON
                      </button>
                    </summary>
                    <pre className="p-2 rounded mt-2 text-[10px] overflow-auto max-h-[200px]" style={{ backgroundColor: 'rgba(7,10,9,0.9)', color: '#e7f0ea', border: '1px solid rgba(231,240,234,0.10)' }}>
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
      <Card style={{ 
        backgroundColor: evidence.safe_mode_applied ? 'rgba(59,209,138,0.14)' : '#0f1512',
        borderColor: evidence.safe_mode_applied ? 'rgba(59,209,138,0.28)' : 'rgba(231, 240, 234, 0.10)',
        boxShadow: '0 1px 0 rgba(255,255,255,0.04) inset'
      }}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold" style={{ color: '#e7f0ea' }}>Validation Summary</CardTitle>
        {evidence.safe_mode_applied && (
          <p className="text-xs mt-2" style={{ color: '#3bd18a' }}>Model could not satisfy contract within repair cap. Output integrity preserved through model-limited execution.</p>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 gap-3 text-xs">
          <div className="rounded p-2 text-center" style={{ backgroundColor: '#131b16' }}>
            <p style={{ color: '#8ea597' }}>Total</p>
            <p className="text-lg font-bold" style={{ color: '#e7f0ea' }}>{evidence.validation_summary.total_checks}</p>
          </div>
          <div className="rounded p-2 text-center" style={{ backgroundColor: evidence.safe_mode_applied ? 'rgba(246,196,83,0.14)' : 'rgba(59,209,138,0.14)' }}>
            <p style={{ color: evidence.safe_mode_applied ? '#f6c453' : '#3bd18a' }}>Passed</p>
            <p className="text-lg font-bold" style={{ color: evidence.safe_mode_applied ? '#f6c453' : '#3bd18a' }}>{evidence.validation_summary.passed_checks}</p>
          </div>
          <div className="rounded p-2 text-center" style={{ backgroundColor: evidence.safe_mode_applied ? 'rgba(59,209,138,0.14)' : 'rgba(242,107,107,0.14)' }}>
            <p style={{ color: evidence.safe_mode_applied ? '#3bd18a' : '#f26b6b' }}>Status</p>
            <p className="text-lg font-bold" style={{ color: evidence.safe_mode_applied ? '#3bd18a' : '#f26b6b' }}>{evidence.safe_mode_applied ? "Contained" : "Failed"}</p>
          </div>
        </div>
            {evidence.validation_summary.failures && evidence.validation_summary.failures.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-medium" style={{ color: '#e7f0ea' }}>Failures:</p>
                {evidence.validation_summary.failures.map((f, i) => (
                  <p key={i} className="text-xs p-2 rounded" style={{ color: '#f26b6b', backgroundColor: 'rgba(242,107,107,0.14)' }}>{f}</p>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}


    </div>
  );
}