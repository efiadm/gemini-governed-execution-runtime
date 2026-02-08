import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Shield, Clock, RotateCcw } from "lucide-react";

export default function ValidationPanel({ validation, evidence }) {
  if (!validation && !evidence) {
    return (
      <Card className="border-slate-200 shadow-sm rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Validation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-400 italic">No validation data yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-200 shadow-sm rounded-2xl">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
          <Shield className="w-4 h-4" />
          Validation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status */}
        <div className="flex flex-wrap items-center gap-3">
          {validation?.passed ? (
            <Badge className="bg-emerald-100 text-emerald-800 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Passed
            </Badge>
          ) : (
            <Badge className="bg-red-100 text-red-800 flex items-center gap-1">
              <XCircle className="w-3 h-3" />
              Failed ({validation?.errorCount || 0} errors)
            </Badge>
          )}

          {evidence?.attempts !== undefined && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <RotateCcw className="w-3 h-3" />
              {evidence.attempts} attempt{evidence.attempts !== 1 ? "s" : ""}
            </div>
          )}

          {evidence?.latency_ms !== undefined && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Clock className="w-3 h-3" />
              {evidence.latency_ms}ms
            </div>
          )}

          {evidence?.safe_mode_applied && (
            <Badge className="bg-amber-100 text-amber-800 text-[10px]">Safe Mode</Badge>
          )}
        </div>

        {/* Errors */}
        {validation?.errors?.length > 0 && (
          <div className="space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Errors</span>
            <ul className="space-y-1">
              {validation.errors.map((err, i) => (
                <li
                  key={i}
                  className="text-xs text-red-700 bg-red-50 px-3 py-1.5 rounded-lg border border-red-100 font-mono"
                >
                  {err}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Evidence summary */}
        {evidence && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 block">Model</span>
              <span className="text-xs font-medium text-slate-700">{evidence.model || "—"}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 block">Mode</span>
              <span className="text-xs font-medium text-slate-700 capitalize">{evidence.mode || "—"}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 block">Grounding</span>
              <span className="text-xs font-medium text-slate-700 capitalize">{evidence.grounding || "—"}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 block">Timestamp</span>
              <span className="text-xs font-medium text-slate-700">{evidence.timestamp || "—"}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}