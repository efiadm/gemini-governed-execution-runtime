import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileJson, FileText, Copy, ChevronDown, ChevronRight } from "lucide-react";
import { toast } from "sonner";

function RenderedSection({ title, items, icon: Icon }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4" style={{ color: '#9aa1a9' }} />}
        <h4 className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#e6e8eb' }}>{title}</h4>
      </div>
      <ul className="space-y-1">
        {items.map((item, i) => (
          <li key={i} className="text-sm leading-relaxed pl-4 border-l-2" style={{ color: '#9aa1a9', borderColor: '#2a3036' }}>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function OutputPanel({ output, evidence, mode, isRunning, showTelemetry = true }) {
  const [view, setView] = useState("rendered");
  const [showExecutionTrace, setShowExecutionTrace] = useState(false);

  const handleCopy = () => {
    const text = view === "raw" ? JSON.stringify(output, null, 2) : JSON.stringify(output);
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  if (isRunning) {
    return (
      <Card className="h-full surface">
        <CardContent className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-3">
            <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-muted-foreground">Processing...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!output) {
    return (
      <Card className="h-full surface">
        <CardContent className="flex items-center justify-center min-h-[400px]">
          <p className="text-sm italic text-muted-foreground">No output yet. Run a prompt to see results.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {/* PANE A: ANSWER */}
      <Card className="surface">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-card-foreground">Answer</CardTitle>
            <div className="flex items-center gap-2">
              {evidence?.safe_mode_applied && (
                <Badge className="bg-amber-100 text-amber-800 text-xs">Safe Mode</Badge>
              )}
              <Button variant="ghost" size="sm" onClick={handleCopy} className="h-7">
                <Copy className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="max-h-[300px] overflow-y-auto">
          {view === "rendered" && mode !== "baseline" && typeof output === "object" ? (
            <RenderedSection title="Answer" items={output.canonical_answer} />
          ) : (
            <pre className="text-xs p-4 rounded-lg overflow-auto font-mono bg-background text-foreground border border-border">
              {typeof output === "string" ? output : JSON.stringify(output, null, 2)}
            </pre>
          )}
        </CardContent>
      </Card>

      {/* PANE B: EXECUTION TRACE (Collapsible) */}
      {showTelemetry && (
        <Card className="surface">
          <CardHeader className="pb-2">
            <button
              onClick={() => setShowExecutionTrace(!showExecutionTrace)}
              className="flex items-center gap-2 text-sm font-semibold w-full text-card-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {showExecutionTrace ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
              Show Execution Trace
            </button>
          </CardHeader>
          {showExecutionTrace && (
            <CardContent className="space-y-4 max-h-[300px] overflow-y-auto">
              {view === "rendered" && mode !== "baseline" && typeof output === "object" ? (
                <>
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
              ) : null}
            </CardContent>
          )}
        </Card>
      )}
    </div>
  );
}