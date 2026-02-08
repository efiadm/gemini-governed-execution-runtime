import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Loader2, Circle } from "lucide-react";

const STEPS = [
  { key: "contract", label: "Contract" },
  { key: "validate", label: "Validate" },
  { key: "repair", label: "Repair" },
  { key: "evidence", label: "Evidence" },
];

export default function ProgressIndicator({ currentStep, mode }) {
  if (!currentStep || mode === "baseline") {
    return null;
  }

  const currentIndex = STEPS.findIndex((s) => s.key === currentStep);

  return (
    <Card className="border-slate-200 shadow-sm rounded-2xl bg-gradient-to-r from-violet-50 to-indigo-50">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => {
            const isComplete = index < currentIndex;
            const isCurrent = index === currentIndex;
            const isPending = index > currentIndex;

            return (
              <React.Fragment key={step.key}>
                <div className="flex items-center gap-2">
                  {isComplete && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  )}
                  {isCurrent && (
                    <Loader2 className="w-5 h-5 text-violet-600 animate-spin" />
                  )}
                  {isPending && (
                    <Circle className="w-5 h-5 text-slate-300" />
                  )}
                  <span
                    className={`text-xs font-medium ${
                      isComplete
                        ? "text-emerald-700"
                        : isCurrent
                        ? "text-violet-700"
                        : "text-slate-400"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-3 ${
                      isComplete ? "bg-emerald-300" : "bg-slate-200"
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}