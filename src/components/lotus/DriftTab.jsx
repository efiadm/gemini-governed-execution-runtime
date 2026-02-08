import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrendingUp, TrendingDown, Minus, AlertTriangle } from "lucide-react";
import { subscribeToRunState, getRunState, getRunHistory } from "./runStore";

export default function DriftTab() {
  const [runState, setRunState] = useState(getRunState());
  const [history, setHistory] = useState(getRunHistory());

  useEffect(() => {
    const unsubscribe = subscribeToRunState((state) => {
      setRunState(state);
      setHistory(getRunHistory());
    });
    return unsubscribe;
  }, []);

  if (!runState.drift) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-slate-400 italic">No drift data yet. Run a prompt to see drift analysis.</p>
      </div>
    );
  }

  const { drift, hallucination } = runState;
  const recentRuns = history.slice(-5);

  const renderStabilityTrend = () => {
    const scores = recentRuns
      .filter(r => r.drift?.stability_score !== null)
      .map(r => r.drift.stability_score);
    
    if (scores.length < 2) return <Minus className="w-4 h-4 text-slate-400" />;
    
    const trend = scores[scores.length - 1] - scores[scores.length - 2];
    if (trend > 0.05) return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (trend < -0.05) return <TrendingDown className="w-4 h-4 text-red-600" />;
    return <Minus className="w-4 h-4 text-slate-400" />;
  };

  return (
    <div className="space-y-6">
      {/* Drift Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase">Structure Quality</CardTitle>
          </CardHeader>
          <CardContent>
            {drift.structure_drift !== null ? (
              <>
                <p className="text-2xl font-bold text-slate-900">{drift.structure_drift}%</p>
                <p className="text-xs text-slate-500 mt-1">
                  {runState.mode === "baseline" ? "Baseline (unstructured)" : "Contract compliance"}
                </p>
              </>
            ) : (
              <p className="text-xs text-slate-400 italic">Not applicable in baseline mode (no governance layer).</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase">Authority Drift</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {drift.authority_drift_flags.total > 0 && (
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              )}
              <p className="text-2xl font-bold text-slate-900">
                {drift.authority_drift_flags.total}
              </p>
            </div>
            <p className="text-xs text-slate-500 mt-1">Override attempts detected</p>
          </CardContent>
        </Card>
      </div>

      {/* Mode Divergence */}
      {drift.mode_divergence && (
        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-slate-700">Mode Divergence</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {drift.mode_divergence.baseline_governed !== null && (
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <span className="text-sm text-slate-700">Baseline ↔ Governed</span>
                  <Badge variant={drift.mode_divergence.baseline_governed > 0.7 ? "default" : "destructive"}>
                    {(drift.mode_divergence.baseline_governed * 100).toFixed(1)}% similar
                  </Badge>
                </div>
              )}
              {drift.mode_divergence.governed_hybrid !== null && (
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <span className="text-sm text-slate-700">Governed ↔ Hybrid</span>
                  <Badge variant={drift.mode_divergence.governed_hybrid > 0.7 ? "default" : "destructive"}>
                    {(drift.mode_divergence.governed_hybrid * 100).toFixed(1)}% similar
                  </Badge>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Authority Drift Flags */}
      {drift.authority_drift_flags.flags.length > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-amber-800">Authority Drift Flags</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {drift.authority_drift_flags.flags.map((flag, i) => (
                <div key={i} className="flex items-center justify-between p-2 bg-white rounded border border-amber-200">
                  <span className="text-xs text-slate-700">{flag.name.replace(/_/g, " ")}</span>
                  <Badge variant="outline" className="text-xs">{flag.count} occurrence(s)</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hallucination Risk */}
      {hallucination && (
        <Card className={`border-2 ${
          hallucination.risk === "HIGH" ? "border-red-300 bg-red-50" :
          hallucination.risk === "MEDIUM" ? "border-yellow-300 bg-yellow-50" :
          "border-green-300 bg-green-50"
        }`}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-slate-800">Hallucination Pattern Recognition</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Badge className={`text-sm ${
                hallucination.risk === "HIGH" ? "bg-red-600" :
                hallucination.risk === "MEDIUM" ? "bg-yellow-600" :
                "bg-green-600"
              }`}>
                {hallucination.risk}
              </Badge>
              <span className="text-xs text-slate-600">Based on citation integrity and validation</span>
            </div>

            {hallucination.citationIntegrity && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-slate-700">Citation Integrity</h4>
                
                {hallucination.citationIntegrity.uncitedLinks.length > 0 && (
                  <div className="text-xs text-red-700 bg-white p-2 rounded border border-red-200">
                    <strong>Uncited Links ({hallucination.citationIntegrity.uncitedLinks.length}):</strong>
                    <ul className="mt-1 ml-4 list-disc space-y-1">
                      {hallucination.citationIntegrity.uncitedLinks.slice(0, 3).map((url, i) => (
                        <li key={i} className="break-all">{url}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {hallucination.citationIntegrity.placeholderLinks.length > 0 && (
                  <div className="text-xs text-red-700 bg-white p-2 rounded border border-red-200">
                    <strong>Placeholder Links ({hallucination.citationIntegrity.placeholderLinks.length}):</strong>
                    <ul className="mt-1 ml-4 list-disc space-y-1">
                      {hallucination.citationIntegrity.placeholderLinks.map((url, i) => (
                        <li key={i} className="break-all">{url}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {hallucination.citationIntegrity.unusedSources.length > 0 && (
                  <div className="text-xs text-amber-700 bg-white p-2 rounded border border-amber-200">
                    <strong>Unused Sources ({hallucination.citationIntegrity.unusedSources.length}):</strong>
                    <span className="ml-1">Sources provided but not referenced in output</span>
                  </div>
                )}

                {hallucination.citationIntegrity.uncitedClaimsWarning && (
                  <div className="text-xs text-amber-700 bg-white p-2 rounded border border-amber-200">
                    <strong>Warning:</strong> Specific claims detected with grounding=on but no sources cited
                  </div>
                )}

                {hallucination.citationIntegrity.uncitedLinks.length === 0 &&
                 hallucination.citationIntegrity.placeholderLinks.length === 0 &&
                 hallucination.citationIntegrity.unusedSources.length === 0 &&
                 !hallucination.citationIntegrity.uncitedClaimsWarning && (
                  <p className="text-xs text-green-700 bg-white p-2 rounded border border-green-200">
                    ✓ No citation integrity issues detected
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Recent Runs Trend */}
      {recentRuns.length > 0 && (
        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-slate-700">Recent Runs (Last 5)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <div className="min-w-[800px]">
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="text-xs">Mode</TableHead>
                    <TableHead className="text-xs">Grounding</TableHead>
                    <TableHead className="text-xs">Model</TableHead>
                    <TableHead className="text-xs">Structure</TableHead>
                    <TableHead className="text-xs">Authority Flags</TableHead>
                    <TableHead className="text-xs">Hallucination Pattern Recognition</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentRuns.map((run, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-xs">
                        <Badge variant="outline" className="text-[10px]">{run.mode}</Badge>
                      </TableCell>
                      <TableCell className="text-xs">
                        <Badge variant="outline" className="text-[10px]">{run.grounding || "—"}</Badge>
                      </TableCell>
                      <TableCell className="text-xs">
                        <span className="text-[10px] text-slate-600">{run.model || "—"}</span>
                      </TableCell>
                      <TableCell className="text-xs font-mono">
                        {run.drift?.structure_drift !== null ? run.drift.structure_drift + "%" : "—"}
                      </TableCell>
                      <TableCell className="text-xs font-mono">
                        {run.drift?.authority_drift_flags?.total || 0}
                      </TableCell>
                      <TableCell className="text-xs">
                        {run.hallucination?.risk ? (
                          <Badge className={`text-[9px] ${
                            run.hallucination.risk === "HIGH" ? "bg-red-600" :
                            run.hallucination.risk === "MEDIUM" ? "bg-yellow-600" :
                            "bg-green-600"
                          }`}>
                            {run.hallucination.risk}
                          </Badge>
                        ) : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}