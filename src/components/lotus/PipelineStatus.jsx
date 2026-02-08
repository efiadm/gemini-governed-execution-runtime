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
    <div className="flex items-center gap-1.5 text-[10px]">
      {stages.map((s, idx) => {
        const status = getStageStatus(s.key);
        return (
          <React.Fragment key={s.key}>
            {status === "complete" && <CheckCircle2 className="w-2.5 h-2.5 text-green-600" />}
            {status === "active" && <Circle className="w-2.5 h-2.5 text-blue-600" />}
            {status === "withheld" && <XCircle className="w-2.5 h-2.5 text-amber-600" />}
            {status === "pending" && <Circle className="w-2.5 h-2.5 text-slate-300" />}
            {idx < stages.length - 1 && <span className="text-slate-400">→</span>}
          </React.Fragment>
        );
      })}
    </div>
  );
}