import React from "react";
import { AlertTriangle, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function TruncationWidget({ truncationRisk, metrics, mode }) {
  if (!metrics) return null;

  return (
    <div className="fixed bottom-6 right-6 bg-slate-900 text-white rounded-xl shadow-2xl p-4 w-64 z-50">
      <div className="flex items-center gap-2 mb-3">
        <Activity className="w-4 h-4 text-slate-400" />
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">Live Telemetry</span>
      </div>

      <div className="space-y-3">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400">Truncation Risk</span>
            <Badge className={`text-[10px] ${
              truncationRisk > 75 ? "bg-red-500/20 text-red-300" :
              truncationRisk > 50 ? "bg-amber-500/20 text-amber-300" :
              "bg-green-500/20 text-green-300"
            }`}>
              {truncationRisk}%
            </Badge>
          </div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${
                truncationRisk > 75 ? "bg-red-500" :
                truncationRisk > 50 ? "bg-amber-500" :
                "bg-green-500"
              }`}
              style={{ width: `${truncationRisk}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-slate-400">Tokens In</span>
            <p className="font-mono text-white">{metrics.billable?.prompt_tokens_in || 0}</p>
          </div>
          <div>
            <span className="text-slate-400">Tokens Out</span>
            <p className="font-mono text-white">{metrics.billable?.completion_tokens_out || 0}</p>
          </div>
        </div>

        {mode === "hybrid" && metrics.hybrid_tokens_saved > 0 && (
          <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-lg p-2">
            <p className="text-xs text-emerald-300">Tokens Saved: ~{metrics.hybrid_tokens_saved}</p>
          </div>
        )}

        {truncationRisk > 75 && (
          <div className="flex items-center gap-1.5 text-xs text-red-300">
            <AlertTriangle className="w-3 h-3" />
            <span>High truncation risk</span>
          </div>
        )}
      </div>
    </div>
  );
}