import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowUp, ArrowDown, Play } from "lucide-react";
import { getBaselineSnapshot, hasBaselineSnapshot, subscribeToRunState, getRunState } from "./runStore";

export default function BaselineDeltaPanel({ onRunBaseline }) {
  const [runState, setRunState] = useState(getRunState());
  const [baselineAvailable, setBaselineAvailable] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToRunState((state) => {
      setRunState(state);
      if (state.prompt_hash && state.model && state.grounding) {
        setBaselineAvailable(hasBaselineSnapshot(state.prompt_hash, state.model, state.grounding));
      }
    });
    return unsubscribe;
  }, []);

  if (!runState.run_id || runState.mode === "baseline") {
    return null;
  }

  const { prompt_hash, model, grounding, mode, performance } = runState;
  const currentPerf = performance?.[mode] || {};
  const baselineSnap = getBaselineSnapshot(prompt_hash, model, grounding);

  if (!baselineAvailable || !baselineSnap) {
    return (
      <Card className="border-amber-200 bg-amber-50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-amber-800">Performance Δ vs Baseline</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-amber-700 mb-3">
            No baseline run found for this prompt/model/grounding combination.
          </p>
          <Button
            size="sm"
            onClick={onRunBaseline}
            className="bg-amber-600 hover:bg-amber-700"
          >
            <Play className="w-3 h-3 mr-2" />
            Run Baseline Now
          </Button>
        </CardContent>
      </Card>
    );
  }

  const baselinePerf = baselineSnap.performance;
  const getDelta = (current, baseline) => {
    if (!current || !baseline) return null;
    return current - baseline;
  };

  const tokenDelta = getDelta(currentPerf.total_model_tokens, baselinePerf.total_model_tokens);
  const latencyDelta = getDelta(currentPerf.total_latency_ms, baselinePerf.total_latency_ms);

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-slate-700">Performance Δ vs Baseline</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between items-center text-xs">
          <span className="text-slate-600">Δ Tokens (billable):</span>
          <div className="flex items-center gap-1">
            {tokenDelta !== null && tokenDelta !== 0 && (
              tokenDelta > 0 ? (
                <ArrowUp className="w-3 h-3 text-red-600" />
              ) : (
                <ArrowDown className="w-3 h-3 text-green-600" />
              )
            )}
            <span className={`font-mono font-semibold ${
              tokenDelta > 0 ? 'text-red-600' : tokenDelta < 0 ? 'text-green-600' : 'text-slate-600'
            }`}>
              {tokenDelta !== null ? `${tokenDelta > 0 ? '+' : ''}${tokenDelta}` : '—'}
            </span>
          </div>
        </div>

        <div className="flex justify-between items-center text-xs">
          <span className="text-slate-600">Δ Latency:</span>
          <div className="flex items-center gap-1">
            {latencyDelta !== null && latencyDelta !== 0 && (
              latencyDelta > 0 ? (
                <ArrowUp className="w-3 h-3 text-red-600" />
              ) : (
                <ArrowDown className="w-3 h-3 text-green-600" />
              )
            )}
            <span className={`font-mono font-semibold ${
              latencyDelta > 0 ? 'text-red-600' : latencyDelta < 0 ? 'text-green-600' : 'text-slate-600'
            }`}>
              {latencyDelta !== null ? `${latencyDelta > 0 ? '+' : ''}${latencyDelta}ms` : '—'}
            </span>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-200">
          <div className="text-[10px] text-slate-500">
            Baseline: {baselinePerf.total_model_tokens}t / {baselinePerf.total_latency_ms}ms
          </div>
          <div className="text-[10px] text-slate-500">
            Current: {currentPerf.total_model_tokens}t / {currentPerf.total_latency_ms}ms
          </div>
        </div>
      </CardContent>
    </Card>
  );
}