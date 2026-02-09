import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Circle, Loader2 } from "lucide-react";

const STEPS = [
  { key: "contract", label: "Contract" },
  { key: "validate", label: "Validate" },
  { key: "repair", label: "Repair" },
  { key: "evidence", label: "Evidence" },
  { key: "complete", label: "Complete" },
  { key: "baseline_call", label: "Model Call" },
];

export default function ProgressStepper({ step, timestamps }) {
  const currentSteps = step === "baseline_call" ? [STEPS[5]] : STEPS.slice(0, 5);
  const currentIndex = currentSteps.findIndex((s) => s.key === step);

  return (
    <Card className="border-slate-200 bg-gradient-to-r from-violet-50 to-indigo-50">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          {currentSteps.map((s, index) => {
            const isComplete = index < currentIndex || step === "complete";
            const isCurrent = index === currentIndex && step !== "complete";
            const isPending = index > currentIndex && step !== "complete";

            return (
              <div key={s.key} className="flex items-center">
                <div className="flex items-center gap-2">
                  {isComplete ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  ) : isCurrent ? (
                    <Loader2 className="w-5 h-5 text-violet-600 animate-spin" />
                  ) : (
                    <Circle className="w-5 h-5 text-slate-300" />
                  )}
                  <span
                    className={`text-xs font-medium ${
                      isComplete ? "text-emerald-700" :
                      isCurrent ? "text-violet-700" :
                      "text-slate-400"
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
                {index < currentSteps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-3 ${isComplete ? "bg-emerald-300" : "bg-slate-200"}`} />
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}