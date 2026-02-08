import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Shield, Zap, AlertTriangle, Filter } from "lucide-react";
import { subscribeToRunState, getRunState } from "./runStore";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ArtifactsTab() {
  const [artifacts, setArtifacts] = useState([]);
  const [showAll, setShowAll] = useState(false);
  const [filterMode, setFilterMode] = useState("all");
  const [filterType, setFilterType] = useState("all");

  useEffect(() => {
    const unsubscribe = subscribeToRunState((state) => {
      setArtifacts(state.artifacts || []);
    });
    
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

  const filteredArtifacts = artifacts.filter(art => {
    if (filterMode !== "all" && art.mode !== filterMode) return false;
    if (filterType !== "all" && art.type !== filterType) return false;
    return true;
  });

  const displayedArtifacts = showAll ? filteredArtifacts : filteredArtifacts.slice(-10);
  const uniqueTypes = [...new Set(artifacts.map(a => a.type))];

  return (
    <div className="space-y-4">
      <Card className="border-slate-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-slate-700">Artifact Store</CardTitle>
            {artifacts.length > 10 && !showAll && (
              <Button variant="ghost" size="sm" onClick={() => setShowAll(true)}>
                View all ({artifacts.length})
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-slate-500 mb-4">
            App runtime artifacts generated during runs. Hybrid uses these to reduce billable tokens.
          </p>

          {artifacts.length > 0 && (
            <div className="flex gap-2 mb-4">
              <Select value={filterMode} onValueChange={setFilterMode}>
                <SelectTrigger className="w-32 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Modes</SelectItem>
                  <SelectItem value="baseline">Baseline</SelectItem>
                  <SelectItem value="governed">Governed</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-32 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {uniqueTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {displayedArtifacts.length === 0 ? (
            <p className="text-sm text-slate-400 italic text-center py-8">
              {artifacts.length === 0 ? "No artifacts yet. Run Governed or Hybrid mode." : "No artifacts match filters."}
            </p>
          ) : (
            <div className="space-y-2">
              {displayedArtifacts.map((art, i) => {
                const Icon = getIcon(art.type);
                return (
                  <div key={i} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <Icon className="w-4 h-4 text-slate-400 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-xs font-medium text-slate-800">{art.type}</p>
                        {art.mode && <Badge variant="outline" className="text-[10px]">{art.mode}</Badge>}
                      </div>
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

          {showAll && filteredArtifacts.length > 10 && (
            <Button variant="ghost" size="sm" onClick={() => setShowAll(false)} className="w-full mt-3">
              Show less
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}