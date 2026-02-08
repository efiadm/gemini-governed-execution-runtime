import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";

export default function ArtifactsTab() {
  const artifacts = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("lotus_artifacts") || "[]") : [];

  return (
    <div className="space-y-4">
      <Card className="border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-slate-700">Local Artifact Store</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-slate-500 mb-4">
            Hybrid mode uses local artifacts to reduce billable tokens by injecting compact context summaries.
          </p>
          {artifacts.length === 0 ? (
            <p className="text-sm text-slate-400 italic text-center py-8">
              No artifacts stored yet. Artifacts are created automatically during hybrid runs.
            </p>
          ) : (
            <div className="space-y-2">
              {artifacts.map((art, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <FileText className="w-4 h-4 text-slate-400 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-800">{art.title || "Untitled"}</p>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{art.summary}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}