import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileJson, FileText, Copy, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

function RenderedSection({ title, items, icon: Icon }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4 text-slate-500" />}
        <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">{title}</h4>
      </div>
      <ul className="space-y-1">
        {items.map((item, i) => (
          <li key={i} className="text-sm text-slate-700 leading-relaxed pl-4 border-l-2 border-slate-200">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function OutputPanel({ output, evidence, mode, isRunning }) {
  const [view, setView] = useState("rendered");

  const handleCopy = () => {
    const text = view === "raw" ? JSON.stringify(output, null, 2) : JSON.stringify(output);
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  if (isRunning) {
    return (
      <Card className="border-slate-200 shadow-sm h-full">
        <CardContent className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-3">
            <div className="w-12 h-12 border-4 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-slate-500">Processing...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!output) {
    return (
      <Card className="border-slate-200 shadow-sm h-full">
        <CardContent className="flex items-center justify-center min-h-[400px]">
          <p className="text-sm text-slate-400 italic">No output yet. Run a prompt to see results.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-200 shadow-sm h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold text-slate-700">Output</CardTitle>
          <div className="flex items-center gap-2">
            {evidence?.safe_mode_applied && (
              <Badge className="bg-amber-100 text-amber-800 text-xs">Safe Mode</Badge>
            )}
            <div className="flex border border-slate-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setView("rendered")}
                className={`px-3 py-1 text-xs font-medium ${
                  view === "rendered" ? "bg-slate-100 text-slate-900" : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <FileText className="w-3 h-3 inline mr-1" />
                Rendered
              </button>
              <button
                onClick={() => setView("raw")}
                className={`px-3 py-1 text-xs font-medium ${
                  view === "raw" ? "bg-slate-100 text-slate-900" : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <FileJson className="w-3 h-3 inline mr-1" />
                Raw JSON
              </button>
            </div>
            <Button variant="ghost" size="sm" onClick={handleCopy} className="h-7">
              <Copy className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 max-h-[600px] overflow-y-auto">
        {view === "rendered" && mode !== "baseline" && typeof output === "object" ? (
          <>
            <RenderedSection title="Answer" items={output.canonical_answer} />
            {output.three_perspectives && (
              <>
                <RenderedSection title="Optimizer" items={output.three_perspectives.optimizer} />
                <RenderedSection title="Skeptic" items={output.three_perspectives.skeptic} />
                <RenderedSection title="Operator" items={output.three_perspectives.operator} />
              </>
            )}
            <RenderedSection title="Unknowns & Checks" items={output.unknowns_and_checks} />
            <RenderedSection title="Next Steps" items={output.next_steps} />
            {output.sources && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Sources</h4>
                <p className="text-xs text-slate-600">{output.sources.note}</p>
                {output.sources.items && output.sources.items.length > 0 && (
                  <ul className="space-y-1">
                    {output.sources.items.map((src, i) => (
                      <li key={i} className="text-xs text-slate-600">
                        • {src.title} {src.url && <a href={src.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">↗</a>}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            {output.risk && (
              <div className="flex items-center gap-2">
                <Badge className={`text-xs ${
                  output.risk.level === "high" ? "bg-red-100 text-red-800" :
                  output.risk.level === "medium" ? "bg-amber-100 text-amber-800" :
                  "bg-green-100 text-green-800"
                }`}>
                  Risk: {output.risk.level}
                </Badge>
              </div>
            )}
            {output.diff_note && output.diff_note.length > 0 && (
              <RenderedSection title="Diff Notes" items={output.diff_note} />
            )}
          </>
        ) : (
          <pre className="text-xs bg-slate-900 text-slate-100 p-4 rounded-lg overflow-auto font-mono">
            {typeof output === "string" ? output : JSON.stringify(output, null, 2)}
          </pre>
        )}
      </CardContent>
    </Card>
  );
}