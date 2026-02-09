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
        <p className="text-sm italic" style={{ color: '#6f7679' }}>No drift data yet. Run a prompt to see drift analysis.</p>
      </div>
    );
  }

  const { drift, hallucination } = runState;
  const recentRuns = history.slice(-5);

  return (
    <div className="space-y-6">
      {/* Drift Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card style={{ backgroundColor: '#1a1f22', borderColor: '#2a3036' }}>
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-semibold uppercase" style={{ color: '#9aa1a9' }}>Structure Quality</CardTitle>
          </CardHeader>
          <CardContent>
            {drift.structure_drift !== null ? (
              <>
                <p className="text-2xl font-bold" style={{ color: '#e6e8eb' }}>{drift.structure_drift}%</p>
                <p className="text-xs mt-1" style={{ color: '#9aa1a9' }}>
                  {runState.mode === "baseline" ? "Baseline (unstructured)" : "Contract compliance"}
                </p>
              </>
            ) : (
              <p className="text-xs italic" style={{ color: '#6f7679' }}>Not applicable in baseline mode (no governance layer).</p>
            )}
          </CardContent>
        </Card>

        <Card style={{ backgroundColor: '#1a1f22', borderColor: '#2a3036' }}>
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-semibold uppercase" style={{ color: '#9aa1a9' }}>Authority Drift</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {drift.authority_drift_flags.total > 0 && (
                <AlertTriangle className="w-5 h-5" style={{ color: '#c09a3a' }} />
              )}
              <p className="text-2xl font-bold" style={{ color: '#e6e8eb' }}>
                {drift.authority_drift_flags.total}
              </p>
            </div>
            <p className="text-xs mt-1" style={{ color: '#9aa1a9' }}>Override attempts detected</p>
          </CardContent>
        </Card>
      </div>

      {/* Mode Divergence */}
      {drift.mode_divergence && (
        <Card style={{ backgroundColor: '#1a1f22', borderColor: '#2a3036' }}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold" style={{ color: '#e6e8eb' }}>Mode Divergence</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {drift.mode_divergence.baseline_governed !== null && (
                <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: '#20262a' }}>
                  <span className="text-sm" style={{ color: '#e6e8eb' }}>Baseline ↔ Governed</span>
                  <Badge variant={drift.mode_divergence.baseline_governed > 0.7 ? "default" : "destructive"}>
                    {(drift.mode_divergence.baseline_governed * 100).toFixed(1)}% similar
                  </Badge>
                </div>
              )}
              {drift.mode_divergence.governed_hybrid !== null && (
                <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: '#20262a' }}>
                  <span className="text-sm" style={{ color: '#e6e8eb' }}>Governed ↔ Hybrid</span>
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
        <Card style={{ backgroundColor: 'rgba(200, 120, 84, 0.08)', borderColor: '#c09a3a' }}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold" style={{ color: '#c09a3a' }}>Authority Drift Flags</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {drift.authority_drift_flags.flags.map((flag, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded" style={{ backgroundColor: '#1a1f22', border: '1px solid #c09a3a' }}>
                  <span className="text-xs" style={{ color: '#e6e8eb' }}>{flag.name.replace(/_/g, " ")}</span>
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
          backgroundColor: hallucination.risk === "HIGH" ? 'rgba(200, 90, 84, 0.1)' : hallucination.risk === "MEDIUM" ? 'rgba(200, 120, 84, 0.08)' : 'rgba(31, 111, 91, 0.05)',
          borderColor: hallucination.risk === "HIGH" ? '#c85a54' : hallucination.risk === "MEDIUM" ? '#c09a3a' : '#1f6f5b',
          border: '2px solid'
        }}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold" style={{ color: '#e6e8eb' }}>Hallucination Pattern Recognition</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Badge style={{
                backgroundColor: hallucination.risk === "HIGH" ? '#c85a54' : hallucination.risk === "MEDIUM" ? '#c09a3a' : '#1f6f5b',
                color: '#ffffff'
              }} className="text-sm">
                {hallucination.risk}
              </Badge>
              <span className="text-xs" style={{ color: '#9aa1a9' }}>Based on citation integrity and validation</span>
            </div>

            {hallucination.citationIntegrity && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold" style={{ color: '#e6e8eb' }}>Citation Integrity</h4>
                
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
        <Card style={{ backgroundColor: '#1a1f22', borderColor: '#2a3036' }}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold" style={{ color: '#e6e8eb' }}>Recent Runs (Last 5)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <div className="min-w-[800px]">
                <div className="rounded-lg overflow-hidden" style={{ border: '1px solid #2a3036' }}>
                  <Table>
                <TableHeader>
                  <TableRow style={{ backgroundColor: '#20262a' }}>
                    <TableHead className="text-xs" style={{ color: '#e6e8eb' }}>Mode</TableHead>
                    <TableHead className="text-xs" style={{ color: '#e6e8eb' }}>Grounding</TableHead>
                    <TableHead className="text-xs" style={{ color: '#e6e8eb' }}>Model</TableHead>
                    <TableHead className="text-xs" style={{ color: '#e6e8eb' }}>Structure</TableHead>
                    <TableHead className="text-xs" style={{ color: '#e6e8eb' }}>Authority Flags</TableHead>
                    <TableHead className="text-xs" style={{ color: '#e6e8eb' }}>Hallucination Pattern Recognition</TableHead>
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
                        <span className="text-[10px]" style={{ color: '#9aa1a9' }}>{run.model || "—"}</span>
                      </TableCell>
                      <TableCell className="text-xs font-mono" style={{ color: '#e6e8eb' }}>
                        {run.drift?.structure_drift !== null ? run.drift.structure_drift + "%" : "—"}
                      </TableCell>
                      <TableCell className="text-xs font-mono" style={{ color: '#e6e8eb' }}>
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