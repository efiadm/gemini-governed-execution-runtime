import React from "react";
import { CheckCircle2, Circle, XCircle } from "lucide-react";

export default function PipelineStatus({ stage, safeModeApplied }) {
  const stages = [
    { key: "knowledge", label: "Knowledge" },
    { key: "governance", label: "Governance" },
    { key: "experience", label: "Experience" },
    { key: "understanding", label: "Understanding" },
    { key: "output", label: "Reliable Output" },
  ];

  const getStageStatus = (stageKey) => {
    const stageIndex = stages.findIndex(s => s.key === stageKey);
    const currentIndex = stages.findIndex(s => s.key === stage);
    
    if (stageIndex < currentIndex) return "complete";
    if (stageIndex === currentIndex) return "active";
    if (safeModeApplied && stageKey === "understanding") return "withheld";
    if (safeModeApplied && stageKey === "output") return "withheld";
    return "pending";
  };

  return (
    <div className="flex items-center gap-2 text-xs">
      {stages.map((s, idx) => {
        const status = getStageStatus(s.key);
        return (
          <React.Fragment key={s.key}>
            <div className="flex items-center gap-1.5">
              {status === "complete" && <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />}
              {status === "active" && <Circle className="w-3.5 h-3.5 text-blue-600 animate-pulse" />}
              {status === "withheld" && <XCircle className="w-3.5 h-3.5 text-amber-600" />}
              {status === "pending" && <Circle className="w-3.5 h-3.5 text-slate-300" />}
              <span className={`font-medium ${
                status === "complete" ? "text-green-700" :
                status === "active" ? "text-blue-700" :
                status === "withheld" ? "text-amber-700" :
                "text-slate-400"
              }`}>
                {s.label}
              </span>
            </div>
            {idx < stages.length - 1 && <span className="text-slate-400">→</span>}
          </React.Fragment>
        );
      })}
    </div>
  );
}