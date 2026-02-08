import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, FileText, Zap, Activity, AlertTriangle } from "lucide-react";

function TelemetryMetric({ icon: Icon, label, value, color = "text-slate-600", badge }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center`}>
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
          {label}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-slate-900">{value}</span>
          {badge}
        </div>
      </div>
    </div>
  );
}

export default function TelemetryPanel({ evidence, mode }) {
  if (!evidence) {
    return (
      <Card className="border-slate-200 shadow-sm rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Live Telemetry
            </span>
          </div>
          <p className="text-xs text-slate-400 italic">
            Waiting for run data...
          </p>
        </CardContent>
      </Card>
    );
  }

  const tokensIn = evidence.attemptDetails?.reduce((sum, att) => 
    sum + (att.tokens_in || 0), 0) || 0;
  const tokensOut = evidence.attemptDetails?.reduce((sum, att) => 
    sum + (att.tokens_out || 0), 0) || 0;
  const totalTokens = tokensIn + tokensOut;
  const truncationRisk = Math.min(100, Math.round((tokensIn / 32000) * 100));

  return (
    <Card className="border-slate-200 shadow-sm rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Live Telemetry
            </span>
          </div>
          <Badge className="bg-emerald-500/20 text-emerald-300 text-[10px] border-emerald-500/30">
            {mode || "—"}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <TelemetryMetric
            icon={Clock}
            label="Latency"
            value={`${evidence.latency_ms}ms`}
            color="text-blue-400"
          />
          <TelemetryMetric
            icon={FileText}
            label="Tokens In"
            value={tokensIn || "—"}
            color="text-purple-400"
          />
          <TelemetryMetric
            icon={FileText}
            label="Tokens Out"
            value={tokensOut || "—"}
            color="text-indigo-400"
          />
          <TelemetryMetric
            icon={Zap}
            label="Repairs"
            value={evidence.repairs || 0}
            color="text-amber-400"
            badge={evidence.repairs > 0 && (
              <Badge className="bg-amber-500/20 text-amber-300 text-[9px] border-amber-500/30">
                +{evidence.repairs}
              </Badge>
            )}
          />
        </div>

        <div className="pt-3 border-t border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
              Truncation Risk
            </span>
            <Badge className={`text-[10px] ${
              truncationRisk > 75 
                ? 'bg-red-500/20 text-red-300 border-red-500/30' 
                : truncationRisk > 50 
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' 
                : 'bg-green-500/20 text-green-300 border-green-500/30'
            }`}>
              {truncationRisk}%
            </Badge>
          </div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${
                truncationRisk > 75 
                  ? 'bg-red-500' 
                  : truncationRisk > 50 
                  ? 'bg-amber-500' 
                  : 'bg-green-500'
              }`}
              style={{ width: `${truncationRisk}%` }}
            />
          </div>
          {truncationRisk > 75 && (
            <div className="flex items-center gap-1.5 mt-2">
              <AlertTriangle className="w-3 h-3 text-red-400" />
              <span className="text-[10px] text-red-300">
                High risk of context truncation
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}