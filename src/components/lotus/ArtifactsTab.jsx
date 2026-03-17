import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { subscribeToRunState, getRunState, getRunHistory } from "./runStore";


export default function ArtifactsTab() {
  const [current, setCurrent] = useState(getRunState());
  const [history, setHistory] = useState(getRunHistory());
  const [showPrev, setShowPrev] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToRunState((state) => {
      setCurrent(state);
      setHistory(getRunHistory());
    });
    // seed on mount
    setCurrent(getRunState());
    setHistory(getRunHistory());
    return unsubscribe;
  }, []);

  const TYPE_LABELS = {
    contract: "Contract (Schema)",
    local_repair: "Local Repair (Normalization)",
    performance: "Performance Metrics",
    baseline_metrics: "Baseline Snapshot",
  };
  const TYPE_ORDER = ["contract", "local_repair", "performance", "baseline_metrics"];
  const MODE_ORDER = ["baseline", "governed", "hybrid"];

  const formatTs = (t) => {
    if (!t) return "—";
    try {
      const d = new Date(t);
      return isNaN(d) ? String(t) : d.toLocaleString();
    } catch {
      return String(t);
    }
  };

  const groupAndDedupe = (arts = []) => {
    const byKey = new Map(); // key = mode|type ; keep last occurrence
    for (const a of arts) {
      const mode = a?.mode || "baseline";
      const type = a?.type;
      if (!TYPE_LABELS[type]) continue; // show only mapped types
      const key = `${mode}|${type}`;
      byKey.set(key, a);
    }
    const grouped = { baseline: [], governed: [], hybrid: [] };
    for (const [key, val] of byKey.entries()) {
      const [mode] = key.split("|");
      if (grouped[mode]) grouped[mode].push(val);
    }
    // sort within each mode by our desired type order
    Object.keys(grouped).forEach((m) => {
      grouped[m].sort((a, b) => TYPE_ORDER.indexOf(a.type) - TYPE_ORDER.indexOf(b.type));
    });
    return grouped;
  };

  const ArtifactItem = ({ artifact, runId }) => {
    const [open, setOpen] = useState(false);
    const label = TYPE_LABELS[artifact?.type] || artifact?.type || "Artifact";
    const ts = artifact?.timestamp || artifact?.time || artifact?.created_at || artifact?.createdAt || current?.timestamp;
    const json = JSON.stringify(artifact ?? {}, null, 2);
    const lines = json.split("\n");
    const preview = lines.slice(0, 3).join("\n") + (lines.length > 3 ? "\n..." : "");

    return (
      <div className="rounded-md border border-slate-200 bg-white">
        <div className="flex items-center justify-between px-3 py-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-800">{label}</span>
            {artifact?.mode && <Badge variant="outline" className="text-[10px]">{artifact.mode}</Badge>}
            {ts && <span className="text-[10px] text-slate-500">{formatTs(ts)}</span>}
            {runId && <span className="text-[10px] text-slate-400">• Run: {runId}</span>}
          </div>
          <Button size="sm" variant="ghost" onClick={() => setOpen(!open)} className="h-7 px-2 text-[11px]">
            {open ? "Collapse" : "Expand"}
          </Button>
        </div>
        <div className="border-t border-slate-200">
          <pre className="p-3 text-[11px] leading-relaxed font-mono whitespace-pre-wrap break-words overflow-auto max-h-64">
            {open ? json : preview}
          </pre>
        </div>
      </div>
    );
  };

  const ModeSection = ({ mode, items, runId }) => {
    if (!items || items.length === 0) return null;
    return (
      <div className="mb-3">
        <div className="text-[11px] font-semibold text-slate-600 mb-2">Mode: {mode}</div>
        <div className="space-y-2">
          {items.map((a, idx) => (
            <ArtifactItem key={`${mode}-${a.type}-${idx}`} artifact={a} runId={runId} />
          ))}
        </div>
      </div>
    );
  };

  const RunCard = ({ run }) => {
    const byMode = groupAndDedupe(run?.artifacts || []);
    return (
      <Card className="border-slate-200">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-slate-800">Run</CardTitle>
            <div className="text-[11px] text-slate-500">{formatTs(run?.timestamp)}{run?.run_id ? ` • ${run.run_id}` : ""}</div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {MODE_ORDER.map((m) => (
            <ModeSection key={m} mode={m} items={byMode[m]} runId={run?.run_id} />
          ))}
        </CardContent>
      </Card>
    );
  };

  // Current run view
  const currentByMode = groupAndDedupe(current?.artifacts || []);
  const currentRun = { run_id: current?.run_id, timestamp: current?.timestamp, artifacts: current?.artifacts };

  // Previous runs (exclude current run id)
  const previousRuns = (history || []).filter((r) => r?.run_id && r.run_id !== current?.run_id);

  return (
    <div className="space-y-4">
      <Card className="border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-slate-700">Artifact Store (Runtime-Local)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <div className="text-xs font-bold text-slate-800 mb-2">Current Run</div>
              <RunCard run={currentRun} />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-bold text-slate-800">Previous Runs</div>
                <Button size="sm" variant="outline" onClick={() => setShowPrev(!showPrev)} className="h-7 px-2 text-[11px]">
                  {showPrev ? "Hide" : `Show (${previousRuns.length})`}
                </Button>
              </div>
              {showPrev && (
                previousRuns.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No previous runs yet.</p>
                ) : (
                  <div className="space-y-4">
                    {previousRuns.map((r, idx) => (
                      <RunCard key={r.run_id || idx} run={r} />
                    ))}
                  </div>
                )
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}