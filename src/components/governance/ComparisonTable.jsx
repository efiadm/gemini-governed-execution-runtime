import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

function MetricCell({ value, baseline, unit = "" }) {
  if (!value && value !== 0) return <span className="text-slate-300">—</span>;
  
  let trend = null;
  if (baseline && baseline !== value) {
    const diff = value - baseline;
    const percent = Math.round((diff / baseline) * 100);
    if (Math.abs(percent) > 5) {
      trend = diff > 0 
        ? <TrendingUp className="w-3 h-3 text-red-500" />
        : <TrendingDown className="w-3 h-3 text-green-500" />;
    } else {
      trend = <Minus className="w-3 h-3 text-slate-400" />;
    }
  }

  return (
    <div className="flex items-center justify-center gap-1.5">
      <span className="font-mono text-xs font-medium">{value}{unit}</span>
      {trend}
    </div>
  );
}

export default function ComparisonTable({ metrics }) {
  if (!metrics || Object.keys(metrics).length === 0) {
    return (
      <Card className="border-slate-200 shadow-sm rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-slate-700">
            Performance Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-400 italic">
            Run tests to see mode-by-mode performance comparison.
          </p>
        </CardContent>
      </Card>
    );
  }

  const { baseline, governed, hybrid } = metrics;
  const baselineLatency = baseline?.latency_ms || 0;

  return (
    <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden">
      <CardHeader className="pb-3 bg-gradient-to-r from-slate-50 to-white">
        <CardTitle className="text-sm font-semibold text-slate-700">
          Performance Comparison
        </CardTitle>
        <p className="text-xs text-slate-500 mt-1">
          Mode-by-mode metrics showing governance cost-benefit
        </p>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="text-xs font-bold">Metric</TableHead>
                <TableHead className="text-center text-xs font-bold">Baseline</TableHead>
                <TableHead className="text-center text-xs font-bold">Governed</TableHead>
                <TableHead className="text-center text-xs font-bold">Hybrid</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="text-xs font-medium text-slate-700">Latency (ms)</TableCell>
                <TableCell className="text-center">
                  <MetricCell value={baseline?.latency_ms} unit="ms" />
                </TableCell>
                <TableCell className="text-center">
                  <MetricCell value={governed?.latency_ms} baseline={baselineLatency} unit="ms" />
                </TableCell>
                <TableCell className="text-center">
                  <MetricCell value={hybrid?.latency_ms} baseline={baselineLatency} unit="ms" />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="text-xs font-medium text-slate-700">Tokens In</TableCell>
                <TableCell className="text-center">
                  <MetricCell value={baseline?.tokens_in} />
                </TableCell>
                <TableCell className="text-center">
                  <MetricCell value={governed?.tokens_in} />
                </TableCell>
                <TableCell className="text-center">
                  <MetricCell value={hybrid?.tokens_in} />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="text-xs font-medium text-slate-700">Tokens Out</TableCell>
                <TableCell className="text-center">
                  <MetricCell value={baseline?.tokens_out} />
                </TableCell>
                <TableCell className="text-center">
                  <MetricCell value={governed?.tokens_out} />
                </TableCell>
                <TableCell className="text-center">
                  <MetricCell value={hybrid?.tokens_out} />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="text-xs font-medium text-slate-700">Total Tokens</TableCell>
                <TableCell className="text-center">
                  <MetricCell value={baseline?.tokens_total} />
                </TableCell>
                <TableCell className="text-center">
                  <MetricCell value={governed?.tokens_total} />
                </TableCell>
                <TableCell className="text-center">
                  <MetricCell value={hybrid?.tokens_total} />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="text-xs font-medium text-slate-700">Repairs</TableCell>
                <TableCell className="text-center">
                  <Badge variant="secondary" className="text-[10px]">N/A</Badge>
                </TableCell>
                <TableCell className="text-center">
                  <MetricCell value={governed?.total_repairs || 0} />
                </TableCell>
                <TableCell className="text-center">
                  <MetricCell value={hybrid?.total_repairs || 0} />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="text-xs font-medium text-slate-700">Validation Pass</TableCell>
                <TableCell className="text-center">
                  <Badge variant="secondary" className="text-[10px]">N/A</Badge>
                </TableCell>
                <TableCell className="text-center">
                  {governed?.validation_pass_rate !== undefined ? (
                    <Badge className="bg-emerald-100 text-emerald-800 text-[10px]">
                      {governed.validation_pass_rate}%
                    </Badge>
                  ) : (
                    <span className="text-slate-300">—</span>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  {hybrid?.validation_pass_rate !== undefined ? (
                    <Badge className="bg-emerald-100 text-emerald-800 text-[10px]">
                      {hybrid.validation_pass_rate}%
                    </Badge>
                  ) : (
                    <span className="text-slate-300">—</span>
                  )}
                </TableCell>
              </TableRow>
              <TableRow className="bg-slate-50">
                <TableCell className="text-xs font-bold text-slate-700">Truncation Risk</TableCell>
                <TableCell className="text-center">
                  {baseline?.tokens_in ? (
                    <Badge className={`text-[10px] ${
                      Math.round((baseline.tokens_in / 32000) * 100) > 75 
                        ? 'bg-red-100 text-red-700' 
                        : Math.round((baseline.tokens_in / 32000) * 100) > 50 
                        ? 'bg-amber-100 text-amber-700' 
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {Math.min(100, Math.round((baseline.tokens_in / 32000) * 100))}%
                    </Badge>
                  ) : <span className="text-slate-300">—</span>}
                </TableCell>
                <TableCell className="text-center">
                  {governed?.tokens_in ? (
                    <Badge className={`text-[10px] ${
                      Math.round((governed.tokens_in / 32000) * 100) > 75 
                        ? 'bg-red-100 text-red-700' 
                        : Math.round((governed.tokens_in / 32000) * 100) > 50 
                        ? 'bg-amber-100 text-amber-700' 
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {Math.min(100, Math.round((governed.tokens_in / 32000) * 100))}%
                    </Badge>
                  ) : <span className="text-slate-300">—</span>}
                </TableCell>
                <TableCell className="text-center">
                  {hybrid?.tokens_in ? (
                    <Badge className={`text-[10px] ${
                      Math.round((hybrid.tokens_in / 32000) * 100) > 75 
                        ? 'bg-red-100 text-red-700' 
                        : Math.round((hybrid.tokens_in / 32000) * 100) > 50 
                        ? 'bg-amber-100 text-amber-700' 
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {Math.min(100, Math.round((hybrid.tokens_in / 32000) * 100))}%
                    </Badge>
                  ) : <span className="text-slate-300">—</span>}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}