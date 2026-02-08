import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Shield, Zap, AlertTriangle } from "lucide-react";
import { subscribeToRunState, getRunState } from "./runStore";

export default function ArtifactsTab() {
  const [artifacts, setArtifacts] = useState([]);

  useEffect(() => {
    const unsubscribe = subscribeToRunState((state) => {
      setArtifacts(state.artifacts || []);
    });
    
    // Initial load
    const state = getRunState();
    setArtifacts(state.artifacts || []);
    
    return unsubscribe;
  }, []);

  const getIcon = (type) => {
    switch (type) {
      case "contract": return Shield;
      case "hybrid_context": return Zap;
      case "safe_mode": return AlertTriangle;
      default: return FileText;
    }
  };

  return (
    <div className="space-y-4">
      <Card className="border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-slate-700">Artifact Store</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-slate-500 mb-4">
            Runtime artifacts generated during Governed and Hybrid runs. Used to reduce billable tokens.
          </p>
          {artifacts.length === 0 ? (
            <p className="text-sm text-slate-400 italic text-center py-8">
              No artifacts yet. Run Governed or Hybrid mode to generate artifacts.
            </p>
          ) : (
            <div className="space-y-2">
              {artifacts.map((art, i) => {
                const Icon = getIcon(art.type);
                return (
                  <div key={i} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <Icon className="w-4 h-4 text-slate-400 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-800">{art.type}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        {art.content || art.header || art.reason || JSON.stringify(art).substring(0, 60)}
                      </p>
                      {art.tokens_saved > 0 && (
                        <p className="text-xs text-emerald-600 mt-1">Tokens saved: ~{art.tokens_saved}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}