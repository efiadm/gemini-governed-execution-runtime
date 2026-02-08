import React from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const toggleOptions = (options, value, onChange) => (
  <div className="inline-flex bg-slate-100 rounded-lg p-0.5">
    {options.map((opt) => (
      <button
        key={opt.value}
        onClick={() => onChange(opt.value)}
        className={cn(
          "px-4 py-1.5 text-xs font-medium rounded-md transition-all duration-200",
          value === opt.value
            ? "bg-white text-slate-900 shadow-sm"
            : "text-slate-500 hover:text-slate-700"
        )}
      >
        {opt.label}
      </button>
    ))}
  </div>
);

export default function ModeControls({
  mode,
  onModeChange,
  grounding,
  onGroundingChange,
  disabled,
}) {
  return (
    <div className="flex flex-wrap items-center gap-6">
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Mode
        </Label>
        <div>
          {toggleOptions(
            [
              { value: "baseline", label: "Baseline" },
              { value: "governed", label: "Governed" },
              { value: "hybrid", label: "Hybrid" },
            ],
            mode,
            disabled ? () => {} : onModeChange
          )}
        </div>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Grounding
        </Label>
        <div>
          {toggleOptions(
            [
              { value: "auto", label: "Auto" },
              { value: "on", label: "On" },
              { value: "off", label: "Off" },
            ],
            grounding,
            disabled ? () => {} : onGroundingChange
          )}
        </div>
      </div>
    </div>
  );
}