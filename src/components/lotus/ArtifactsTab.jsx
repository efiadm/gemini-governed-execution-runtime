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
  const [showLimit] = useState(10);

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

  const displayedArtifacts = showAll ? filteredArtifacts : filteredArtifacts.slice(-showLimit);
  const uniqueTypes = [...new Set(artifacts.map(a => a.type))];

  return (
    <div className="space-y-4">
      <Card style={{ backgroundColor: '#0f1512', borderColor: 'rgba(231, 240, 234, 0.10)', boxShadow: '0 1px 0 rgba(255,255,255,0.04) inset' }}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold" style={{ color: '#e7f0ea' }}>Artifact Store (Runtime-Local)</CardTitle>
            {artifacts.length > showLimit && !showAll && (
              <Button variant="ghost" size="sm" onClick={() => setShowAll(true)}>
                Show all ({artifacts.length})
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-xs mb-4" style={{ color: '#8ea597' }}>
            Runtime artifacts (app logic, non-billable). Hybrid mode uses these to reduce billable model tokens.
          </p>

          {artifacts.length > 0 && (
            <div className="flex gap-2 mb-4">
              <Select value={filterMode} onValueChange={setFilterMode}>
                <SelectTrigger className="w-32 h-8 text-xs" style={{ backgroundColor: 'rgba(11, 15, 13, 0.95)', borderColor: 'rgba(231,240,234,0.18)', color: '#e7f0ea' }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent style={{ backgroundColor: '#0f1512', borderColor: 'rgba(231, 240, 234, 0.10)', boxShadow: '0 10px 30px rgba(0,0,0,0.45)' }}>
                  <SelectItem value="all">All Modes</SelectItem>
                  <SelectItem value="baseline">Baseline</SelectItem>
                  <SelectItem value="governed">Governed</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-32 h-8 text-xs" style={{ backgroundColor: 'rgba(11, 15, 13, 0.95)', borderColor: 'rgba(231,240,234,0.18)', color: '#e7f0ea' }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent style={{ backgroundColor: '#0f1512', borderColor: 'rgba(231, 240, 234, 0.10)', boxShadow: '0 10px 30px rgba(0,0,0,0.45)' }}>
                  <SelectItem value="all">All Types</SelectItem>
                  {uniqueTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {displayedArtifacts.length === 0 ? (
            <p className="text-sm italic text-center py-8" style={{ color: '#8ea597' }}>
              {artifacts.length === 0 ? "No artifacts yet. Run Governed or Hybrid mode." : "No artifacts match filters."}
            </p>
          ) : (
            <div className="space-y-2">
              {displayedArtifacts.map((art, i) => {
                const Icon = getIcon(art.type);
                return (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg" style={{ backgroundColor: '#131b16', border: '1px solid rgba(231, 240, 234, 0.10)' }}>
                    <Icon className="w-4 h-4 mt-0.5" style={{ color: '#8ea597' }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-xs font-medium" style={{ color: '#e7f0ea' }}>{art.type}</p>
                        {art.mode && <Badge variant="outline" className="text-[10px]" style={{ backgroundColor: 'rgba(231,240,234,0.08)', color: '#e7f0ea', borderColor: 'rgba(231, 240, 234, 0.14)' }}>{art.mode}</Badge>}
                      </div>
                      <p className="text-xs mt-1" style={{ color: '#8ea597' }}>
                        {art.content || art.header || art.reason || JSON.stringify(art).substring(0, 60)}
                      </p>
                      {art.tokens_saved > 0 && (
                        <p className="text-xs mt-1" style={{ color: '#2db37a' }}>Tokens saved: ~{art.tokens_saved}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {showAll && filteredArtifacts.length > showLimit && (
            <Button variant="ghost" size="sm" onClick={() => setShowAll(false)} className="w-full mt-3">
              Show last {showLimit} only
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}