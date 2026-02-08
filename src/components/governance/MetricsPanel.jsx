import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, Clock, FileText, AlertTriangle } from "lucide-react";

function MetricCard({ icon: Icon, label, value, color, comparison }) {
  return (
    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${color}`} />
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</span>
      </div>
      <div className="text-2xl font-bold text-slate-900">{value}</div>
      {comparison && (
        <div className="text-xs text-slate-500 mt-1">{comparison}</div>
      )}
    </div>
  );
}

function ComparisonBar({ baseline, governed, hybrid, metric }) {
  const max = Math.max(baseline || 0, governed || 0, hybrid || 0);
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-slate-700">{metric}</span>
        <span className="text-slate-500">Comparison</span>
      </div>
      <div className="space-y-2">
        {baseline !== undefined && (
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-slate-600">Baseline</span>
              <span className="font-medium text-slate-900">{baseline}</span>
            </div>
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-slate-500 rounded-full transition-all"
                style={{ width: `${(baseline / max) * 100}%` }}
              />
            </div>
          </div>
        )}
        {governed !== undefined && (
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-slate-600">Governed</span>
              <span className="font-medium text-slate-900">{governed}</span>
            </div>
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-violet-500 rounded-full transition-all"
                style={{ width: `${(governed / max) * 100}%` }}
              />
            </div>
          </div>
        )}
        {hybrid !== undefined && (
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-slate-600">Hybrid</span>
              <span className="font-medium text-slate-900">{hybrid}</span>
            </div>
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all"
                style={{ width: `${(hybrid / max) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MetricsPanel({ metrics }) {
  if (!metrics || Object.keys(metrics).length === 0) {
    return (
      <Card className="border-slate-200 shadow-sm rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-slate-700">Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-400 italic">Run tests to see performance comparisons.</p>
        </CardContent>
      </Card>
    );
  }

  const { baseline, governed, hybrid } = metrics;
  
  const truncationRisk = governed?.tokens_in 
    ? Math.min(100, Math.round((governed.tokens_in / 32000) * 100))
    : 0;

  return (
    <Card className="border-slate-200 shadow-sm rounded-2xl">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold text-slate-700">Performance Metrics</CardTitle>
          {truncationRisk > 0 && (
            <Badge className={`text-xs ${truncationRisk > 75 ? 'bg-red-100 text-red-700' : truncationRisk > 50 ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
              <AlertTriangle className="w-3 h-3 mr-1" />
              {truncationRisk}% Context
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricCard
            icon={Clock}
            label="Avg Latency"
            value={`${governed?.latency_ms || baseline?.latency_ms || 0}ms`}
            color="text-blue-600"
          />
          <MetricCard
            icon={FileText}
            label="Tokens In"
            value={governed?.tokens_in || baseline?.tokens_in || 0}
            color="text-purple-600"
          />
          <MetricCard
            icon={FileText}
            label="Tokens Out"
            value={governed?.tokens_out || baseline?.tokens_out || 0}
            color="text-indigo-600"
          />
          <MetricCard
            icon={Zap}
            label="Repairs"
            value={governed?.total_repairs || hybrid?.total_repairs || 0}
            color="text-amber-600"
          />
        </div>

        {/* Comparison Bars */}
        {(baseline || governed || hybrid) && (
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <ComparisonBar
              baseline={baseline?.latency_ms}
              governed={governed?.latency_ms}
              hybrid={hybrid?.latency_ms}
              metric="Latency (ms)"
            />
            <ComparisonBar
              baseline={baseline?.tokens_total}
              governed={governed?.tokens_total}
              hybrid={hybrid?.tokens_total}
              metric="Total Tokens"
            />
          </div>
        )}

        {/* Cost-Benefit Summary */}
        {governed && baseline && (
          <div className="pt-4 border-t border-slate-100 space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block">
              Cost-Benefit Analysis
            </span>
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-emerald-700">Reliability Gain</span>
                <span className="font-bold text-emerald-900">
                  {governed.validation_pass_rate || 0}% pass rate
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-emerald-700">Latency Overhead</span>
                <span className="font-bold text-emerald-900">
                  +{governed.latency_ms - baseline.latency_ms}ms ({Math.round(((governed.latency_ms - baseline.latency_ms) / baseline.latency_ms) * 100)}%)
                </span>
              </div>
              {hybrid && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-emerald-700">Hybrid Improvement</span>
                  <span className="font-bold text-emerald-900">
                    {Math.round(((governed.latency_ms - hybrid.latency_ms) / governed.latency_ms) * 100)}% faster than governed
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}