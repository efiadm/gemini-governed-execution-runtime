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
        <p className="text-sm italic" style={{ color: '#8ea597' }}>No drift data yet. Run a prompt to see drift analysis.</p>
      </div>
    );
  }

  const { drift, hallucination } = runState;
  const recentRuns = history.slice(-5);

  return (
    <div className="space-y-6">
      {/* Drift Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card style={{ backgroundColor: '#0f1512', borderColor: 'rgba(231, 240, 234, 0.10)', boxShadow: '0 1px 0 rgba(255,255,255,0.04) inset' }}>
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-semibold uppercase" style={{ color: '#8ea597' }}>Structure Quality</CardTitle>
          </CardHeader>
          <CardContent>
            {drift.structure_drift !== null ? (
              <>
                <p className="text-2xl font-bold" style={{ color: '#e7f0ea' }}>{drift.structure_drift}%</p>
                <p className="text-xs mt-1" style={{ color: '#8ea597' }}>
                  {runState.mode === "baseline" ? "Baseline (unstructured)" : "Contract compliance"}
                </p>
              </>
            ) : (
              <p className="text-xs italic" style={{ color: '#8ea597' }}>Not applicable in baseline mode (no governance layer).</p>
            )}
          </CardContent>
        </Card>

        <Card style={{ backgroundColor: '#0f1512', borderColor: 'rgba(231, 240, 234, 0.10)', boxShadow: '0 1px 0 rgba(255,255,255,0.04) inset' }}>
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-semibold uppercase" style={{ color: '#8ea597' }}>Authority Drift</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {drift.authority_drift_flags.total > 0 && (
                <AlertTriangle className="w-5 h-5" style={{ color: '#f6c453' }} />
              )}
              <p className="text-2xl font-bold" style={{ color: '#e7f0ea' }}>
                {drift.authority_drift_flags.total}
              </p>
            </div>
            <p className="text-xs mt-1" style={{ color: '#8ea597' }}>Override attempts detected</p>
          </CardContent>
        </Card>
      </div>

      {/* Mode Divergence */}
      {drift.mode_divergence && (
        <Card style={{ backgroundColor: '#0f1512', borderColor: 'rgba(231, 240, 234, 0.10)', boxShadow: '0 1px 0 rgba(255,255,255,0.04) inset' }}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold" style={{ color: '#e7f0ea' }}>Mode Divergence</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {drift.mode_divergence.baseline_governed !== null && (
                <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: '#131b16' }}>
                  <span className="text-sm" style={{ color: '#e7f0ea' }}>Baseline ↔ Governed</span>
                  <Badge variant={drift.mode_divergence.baseline_governed > 0.7 ? "default" : "destructive"}>
                    {(drift.mode_divergence.baseline_governed * 100).toFixed(1)}% similar
                  </Badge>
                </div>
              )}
              {drift.mode_divergence.governed_hybrid !== null && (
                <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: '#131b16' }}>
                  <span className="text-sm" style={{ color: '#e7f0ea' }}>Governed ↔ Hybrid</span>
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
        <Card style={{ backgroundColor: 'rgba(246,196,83,0.14)', borderColor: 'rgba(246,196,83,0.28)' }}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold" style={{ color: '#f6c453' }}>Authority Drift Flags</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {drift.authority_drift_flags.flags.map((flag, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded" style={{ backgroundColor: '#131b16', border: '1px solid rgba(246,196,83,0.28)' }}>
                  <span className="text-xs" style={{ color: '#e7f0ea' }}>{flag.name.replace(/_/g, " ")}</span>
                  <Badge variant="outline" className="text-xs">{flag.count} occurrence(s)</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hallucination Risk */}
      {hallucination && (
        <Card style={{
          backgroundColor: hallucination.risk === "HIGH" ? 'rgba(242,107,107,0.14)' : hallucination.risk === "MEDIUM" ? 'rgba(246,196,83,0.14)' : 'rgba(59,209,138,0.14)',
          borderColor: hallucination.risk === "HIGH" ? 'rgba(242,107,107,0.28)' : hallucination.risk === "MEDIUM" ? 'rgba(246,196,83,0.28)' : 'rgba(59,209,138,0.28)',
          border: '2px solid'
        }}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold" style={{ color: '#e7f0ea' }}>Hallucination Pattern Recognition</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Badge style={{
                backgroundColor: hallucination.risk === "HIGH" ? '#f26b6b' : hallucination.risk === "MEDIUM" ? '#f6c453' : '#3bd18a',
                color: '#0b0f0d',
                fontWeight: '600'
              }} className="text-sm">
                {hallucination.risk}
              </Badge>
              <span className="text-xs" style={{ color: '#8ea597' }}>Based on citation integrity and validation</span>
            </div>

            {hallucination.citationIntegrity && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold" style={{ color: '#e7f0ea' }}>Citation Integrity</h4>
                
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
        <Card style={{ backgroundColor: '#0f1512', borderColor: 'rgba(231, 240, 234, 0.10)', boxShadow: '0 1px 0 rgba(255,255,255,0.04) inset' }}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold" style={{ color: '#e7f0ea' }}>Recent Runs (Last 5)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <div className="min-w-[800px]">
                <div className="rounded-lg overflow-hidden" style={{ border: '1px solid rgba(231, 240, 234, 0.10)' }}>
                  <Table>
                <TableHeader>
                  <TableRow style={{ backgroundColor: 'linear-gradient(180deg, rgba(19,27,22,0.95), rgba(15,21,18,0.95))' }}>
                    <TableHead className="text-xs" style={{ color: '#c7d6cc' }}>Mode</TableHead>
                    <TableHead className="text-xs" style={{ color: '#c7d6cc' }}>Grounding</TableHead>
                    <TableHead className="text-xs" style={{ color: '#c7d6cc' }}>Model</TableHead>
                    <TableHead className="text-xs" style={{ color: '#c7d6cc' }}>Structure</TableHead>
                    <TableHead className="text-xs" style={{ color: '#c7d6cc' }}>Authority Flags</TableHead>
                    <TableHead className="text-xs" style={{ color: '#c7d6cc' }}>Hallucination Pattern Recognition</TableHead>
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
                        <span className="text-[10px]" style={{ color: '#8ea597' }}>{run.model || "—"}</span>
                      </TableCell>
                      <TableCell className="text-xs font-mono" style={{ color: '#e7f0ea' }}>
                        {run.drift?.structure_drift !== null ? run.drift.structure_drift + "%" : "—"}
                      </TableCell>
                      <TableCell className="text-xs font-mono" style={{ color: '#e7f0ea' }}>
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