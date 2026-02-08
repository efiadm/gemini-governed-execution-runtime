import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Info, ChevronDown, ChevronRight, FileCheck, Search, Wrench, ScrollText } from "lucide-react";

const steps = [
  {
    icon: FileCheck,
    title: "Contract",
    desc: "Every governed response must conform to a strict JSON schema with required keys, types, and invariants — three perspectives, source rules, no narration.",
    color: "text-violet-600 bg-violet-50",
  },
  {
    icon: Search,
    title: "Validate",
    desc: "The output is parsed and validated locally against the contract: JSON parseability, required keys & types, source invariants, narration detection.",
    color: "text-blue-600 bg-blue-50",
  },
  {
    icon: Wrench,
    title: "Repair",
    desc: "If validation fails, the errors are sent back to the model with the original output for up to 2 repair attempts. If still failing, safe-mode JSON is applied.",
    color: "text-amber-600 bg-amber-50",
  },
  {
    icon: ScrollText,
    title: "Evidence",
    desc: "Every run produces a timestamped evidence record: model, mode, grounding, latency, attempts, validation results — downloadable as JSON.",
    color: "text-emerald-600 bg-emerald-50",
  },
];

export default function HowItWorks() {
  const [open, setOpen] = useState(false);

  return (
    <Card className="border-slate-200 shadow-sm rounded-2xl">
      <CardHeader className="pb-3 cursor-pointer select-none" onClick={() => setOpen(!open)}>
        <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
          <Info className="w-4 h-4" />
          How It Works
          {open ? (
            <ChevronDown className="w-4 h-4 text-slate-400 ml-auto" />
          ) : (
            <ChevronRight className="w-4 h-4 text-slate-400 ml-auto" />
          )}
        </CardTitle>
      </CardHeader>
      {open && (
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {steps.map((step, i) => (
              <div key={i} className="flex flex-col items-start gap-2">
                <div className={`p-2 rounded-lg ${step.color}`}>
                  <step.icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    {i + 1}. {step.title}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
}