import React from "react";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, TrendingUp, TrendingDown, Zap, Globe } from "lucide-react";

export default function TelemetryStrip({ metrics, deltaMetrics, truncationRisk, mode }) {
  if (!metrics) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-slate-900 text-white rounded-lg shadow-2xl p-3 flex items-center gap-4 text-xs z-50 max-w-2xl">
      <Badge className="bg-slate-700 text-slate-200 text-[10px]">{mode || "—"}</Badge>
      
      {truncationRisk !== undefined && (
        <div className="flex items-center gap-1.5">
          <AlertTriangle className={`w-3 h-3 ${
            truncationRisk > 75 ? "text-red-400" : truncationRisk > 50 ? "text-amber-400" : "text-green-400"
          }`} />
          <span className="text-slate-300">Risk:</span>
          <span className="font-bold">{truncationRisk}%</span>
        </div>
      )}
      
      {deltaMetrics?.delta_tokens_vs_baseline !== undefined && (
        <div className="flex items-center gap-1.5">
          {deltaMetrics.delta_tokens_vs_baseline > 0 ? (
            <TrendingUp className="w-3 h-3 text-red-400" />
          ) : deltaMetrics.delta_tokens_vs_baseline < 0 ? (
            <TrendingDown className="w-3 h-3 text-green-400" />
          ) : null}
          <span className="text-slate-300">Δ Tokens:</span>
          <span className="font-bold">
            {deltaMetrics.delta_tokens_vs_baseline > 0 ? "+" : ""}
            {deltaMetrics.delta_tokens_vs_baseline} ({deltaMetrics.delta_tokens_pct}%)
          </span>
        </div>
      )}
      
      {deltaMetrics?.delta_latency_vs_baseline !== undefined && (
        <div className="flex items-center gap-1.5">
          {deltaMetrics.delta_latency_vs_baseline > 0 ? (
            <TrendingUp className="w-3 h-3 text-red-400" />
          ) : deltaMetrics.delta_latency_vs_baseline < 0 ? (
            <TrendingDown className="w-3 h-3 text-green-400" />
          ) : null}
          <span className="text-slate-300">Δ Latency:</span>
          <span className="font-bold">
            {deltaMetrics.delta_latency_vs_baseline > 0 ? "+" : ""}
            {deltaMetrics.delta_latency_vs_baseline}ms ({deltaMetrics.delta_latency_pct}%)
          </span>
        </div>
      )}
      
      {metrics.repair?.repair_attempts_count > 0 && (
        <div className="flex items-center gap-1.5">
          <Zap className="w-3 h-3 text-amber-400" />
          <span className="text-slate-300">Repairs:</span>
          <span className="font-bold">{metrics.repair.repair_attempts_count}</span>
        </div>
      )}
      
      {metrics.tools?.grounding_used && (
        <div className="flex items-center gap-1.5">
          <Globe className="w-3 h-3 text-blue-400" />
          <span className="text-slate-300">Grounding</span>
        </div>
      )}
    </div>
  );
}