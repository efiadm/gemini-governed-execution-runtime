import React from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export default function PromptInput({ value, onChange, disabled }) {
  return (
    <div className="space-y-2">
      <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
        Prompt
      </Label>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder="Enter your prompt…"
        className="min-h-[120px] bg-white border-slate-200 focus:border-slate-400 focus:ring-slate-400 text-sm font-mono resize-y rounded-xl shadow-sm"
      />
    </div>
  );
}