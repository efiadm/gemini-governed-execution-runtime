import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Code2, ChevronDown, ChevronRight, Copy, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function RawJsonPanel({ data }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const jsonString = data ? JSON.stringify(data, null, 2) : null;

  const handleCopy = () => {
    if (jsonString) {
      navigator.clipboard.writeText(jsonString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Card className="border-slate-200 shadow-sm rounded-2xl">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle
            className="text-sm font-semibold text-slate-700 flex items-center gap-2 cursor-pointer select-none"
            onClick={() => setExpanded(!expanded)}
          >
            <Code2 className="w-4 h-4" />
            Raw JSON
            {expanded ? (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-400" />
            )}
            {!data && <Badge variant="secondary" className="text-[10px]">Empty</Badge>}
          </CardTitle>
          {expanded && jsonString && (
            <Button variant="ghost" size="sm" onClick={handleCopy} className="h-7 text-xs">
              {copied ? (
                <CheckCircle2 className="w-3 h-3 mr-1 text-green-600" />
              ) : (
                <Copy className="w-3 h-3 mr-1" />
              )}
              {copied ? "Copied" : "Copy"}
            </Button>
          )}
        </div>
      </CardHeader>
      {expanded && (
        <CardContent>
          {jsonString ? (
            <pre className="text-xs font-mono bg-slate-900 text-slate-100 p-4 rounded-xl overflow-auto max-h-[400px] leading-relaxed">
              {jsonString}
            </pre>
          ) : (
            <p className="text-sm text-slate-400 italic">No data.</p>
          )}
        </CardContent>
      )}
    </Card>
  );
}