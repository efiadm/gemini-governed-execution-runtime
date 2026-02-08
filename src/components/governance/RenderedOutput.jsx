import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Globe, AlertTriangle, ArrowRight, HelpCircle, Eye } from "lucide-react";

function PerspectiveBlock({ title, icon: Icon, items, color }) {
  return (
    <div className={`rounded-xl border p-4 ${color}`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4" />
        <span className="text-xs font-bold uppercase tracking-wider">{title}</span>
      </div>
      <ul className="space-y-1">
        {items?.map((item, i) => (
          <li key={i} className="text-sm leading-relaxed">{item}</li>
        ))}
      </ul>
    </div>
  );
}

export default function RenderedOutput({ data, mode }) {
  if (!data) {
    return (
      <Card className="border-slate-200 shadow-sm rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Rendered Output
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-400 italic">Run a prompt to see output here.</p>
        </CardContent>
      </Card>
    );
  }

  if (mode === "baseline") {
    return (
      <Card className="border-slate-200 shadow-sm rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Rendered Output
            <Badge variant="secondary" className="text-[10px]">Baseline</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm leading-relaxed whitespace-pre-wrap text-slate-700 font-mono bg-slate-50 p-4 rounded-xl">
            {typeof data === "string" ? data : JSON.stringify(data, null, 2)}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Governed mode: render structured output
  const output = typeof data === "string" ? null : data;
  if (!output) {
    return (
      <Card className="border-slate-200 shadow-sm rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Rendered Output
            <Badge variant="secondary" className="text-[10px]">Governed</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm whitespace-pre-wrap text-slate-700">{String(data)}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-200 shadow-sm rounded-2xl">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
          <Eye className="w-4 h-4" />
          Rendered Output
          <Badge variant="secondary" className="text-[10px]">Governed</Badge>
          {output.risk?.safe_mode_applied && (
            <Badge className="bg-amber-100 text-amber-800 text-[10px]">Safe Mode</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Canonical Answer */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Answer</span>
          </div>
          <div className="space-y-2">
            {output.canonical_answer?.map((p, i) => (
              <p key={i} className="text-sm leading-relaxed text-slate-700">{p}</p>
            ))}
          </div>
        </div>

        {/* Three Perspectives */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <PerspectiveBlock
            title="Optimizer"
            icon={ArrowRight}
            items={output.three_perspectives?.optimizer}
            color="bg-emerald-50 border-emerald-200 text-emerald-800"
          />
          <PerspectiveBlock
            title="Skeptic"
            icon={AlertTriangle}
            items={output.three_perspectives?.skeptic}
            color="bg-amber-50 border-amber-200 text-amber-800"
          />
          <PerspectiveBlock
            title="Operator"
            icon={HelpCircle}
            items={output.three_perspectives?.operator}
            color="bg-blue-50 border-blue-200 text-blue-800"
          />
        </div>

        {/* Unknowns & Next Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">Unknowns & Checks</span>
            <ul className="space-y-1">
              {output.unknowns_and_checks?.map((u, i) => (
                <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                  <span className="text-slate-400 mt-0.5">•</span>{u}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">Next Steps</span>
            <ul className="space-y-1">
              {output.next_steps?.map((n, i) => (
                <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                  <span className="text-slate-400 mt-0.5">→</span>{n}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Sources */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Globe className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Sources</span>
            <Badge variant={output.sources?.used ? "default" : "secondary"} className="text-[10px]">
              {output.sources?.used ? "Grounded" : "Ungrounded"}
            </Badge>
          </div>
          {output.sources?.used && output.sources?.items?.length > 0 ? (
            <ul className="space-y-1">
              {output.sources.items.map((s, i) => (
                <li key={i} className="text-sm">
                  <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    {s.title}
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500 italic">{output.sources?.note}</p>
          )}
        </div>

        {/* Risk & Diff */}
        <div className="flex flex-wrap gap-3 items-center">
          <Badge className={
            output.risk?.level === "low" ? "bg-green-100 text-green-800" :
            output.risk?.level === "medium" ? "bg-amber-100 text-amber-800" :
            "bg-red-100 text-red-800"
          }>
            Risk: {output.risk?.level}
          </Badge>
          {output.diff_note?.length > 0 && output.diff_note[0] !== "" && (
            <div className="text-xs text-slate-500">
              <span className="font-semibold">Diff:</span> {output.diff_note.join("; ")}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}