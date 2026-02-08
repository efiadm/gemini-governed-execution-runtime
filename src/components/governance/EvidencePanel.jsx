import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, ChevronDown, ChevronRight, Clock, RotateCcw, Download } from "lucide-react";

function AttemptAccordion({ attempt, index }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-4 py-3 flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition-colors"
      >
        <div className="flex items-center gap-3">
          {attempt.ok ? (
            <CheckCircle2 className="w-4 h-4 text-green-600" />
          ) : (
            <XCircle className="w-4 h-4 text-red-500" />
          )}
          <span className="text-sm font-medium text-slate-700">
            Attempt {index + 1} ({attempt.kind})
          </span>
          <Badge variant={attempt.ok ? "default" : "destructive"} className="text-xs">
            {attempt.ok ? "PASS" : "FAIL"}
          </Badge>
          <span className="text-xs text-slate-500">{attempt.latency_ms}ms</span>
        </div>
        {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </button>
      {open && (
        <div className="p-4 space-y-3 bg-white">
          {attempt.raw_preview && (
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Raw Preview
              </span>
              <pre className="text-xs bg-slate-900 text-slate-100 p-3 rounded-lg overflow-auto font-mono">
                {attempt.raw_preview}
              </pre>
            </div>
          )}
          {attempt.errors && attempt.errors.length > 0 && (
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Validation Errors
              </span>
              <ul className="space-y-1">
                {attempt.errors.map((err, i) => (
                  <li
                    key={i}
                    className="text-xs text-red-700 bg-red-50 px-3 py-1.5 rounded-lg border border-red-100"
                  >
                    {err}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function EvidencePanel({ evidence, onDownload }) {
  if (!evidence) {
    return (
      <Card className="border-slate-200 shadow-sm rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-slate-700">Evidence</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-400 italic">No evidence data yet. Run a prompt to see details.</p>
        </CardContent>
      </Card>
    );
  }

  const { timestamp, mode, model, grounding, latency_ms, attempts, repairs, validation_passed, safe_mode_applied, attemptDetails } = evidence;

  return (
    <Card className="border-slate-200 shadow-sm rounded-2xl">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-semibold text-slate-700">Evidence</CardTitle>
        {onDownload && (
          <Button variant="ghost" size="sm" onClick={onDownload} className="h-7 text-xs">
            <Download className="w-3 h-3 mr-1" />
            Download JSON
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-slate-400 block">Mode</span>
            <span className="text-xs font-medium text-slate-700 capitalize">{mode}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-wider text-slate-400 block">Grounding</span>
            <span className="text-xs font-medium text-slate-700 capitalize">{grounding}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-wider text-slate-400 block">Model</span>
            <span className="text-xs font-medium text-slate-700">{model || "—"}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-wider text-slate-400 block">Timestamp</span>
            <span className="text-xs font-medium text-slate-700">
              {timestamp ? new Date(timestamp).toLocaleTimeString() : "—"}
            </span>
          </div>
        </div>

        {/* Validation Status */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100">
          {validation_passed !== undefined && (
            <Badge className={validation_passed ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}>
              {validation_passed ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
              {validation_passed ? "PASS" : "FAIL"}
            </Badge>
          )}
          {attempts !== undefined && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <RotateCcw className="w-3 h-3" />
              {attempts} attempt{attempts !== 1 ? "s" : ""}
            </div>
          )}
          {repairs !== undefined && repairs > 0 && (
            <div className="text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded">
              {repairs} repair{repairs !== 1 ? "s" : ""}
            </div>
          )}
          {latency_ms !== undefined && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Clock className="w-3 h-3" />
              {latency_ms}ms
            </div>
          )}
          {safe_mode_applied && (
            <Badge className="bg-amber-100 text-amber-800 text-xs">Safe Mode</Badge>
          )}
        </div>

        {/* Per-Attempt Drill-Down */}
        {attemptDetails && attemptDetails.length > 0 && (
          <div className="space-y-2 pt-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block">
              Attempt History
            </span>
            {attemptDetails.map((att, i) => (
              <AttemptAccordion key={i} attempt={att} index={i} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}