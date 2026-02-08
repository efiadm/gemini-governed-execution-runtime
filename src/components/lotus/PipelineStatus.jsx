import React from "react";
import { CheckCircle2, Circle, XCircle } from "lucide-react";

export default function PipelineStatus({ stage, safeModeApplied }) {
  const stages = [
    { key: "knowledge", label: "Knowledge", tooltip: "Raw Gemini 3 inference completed." },
    { key: "governance", label: "Governance", tooltip: "Output evaluated against explicit constraints and contracts." },
    { key: "experience", label: "Experience", tooltip: "Outcome recorded for validation and reliability tracking." },
    { key: "understanding", label: "Understanding", tooltip: "Contract satisfied based on observed behavior." },
    { key: "output", label: "Reliable Output", tooltip: "Output released for use." },
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
    <div>
      <div className="flex items-center gap-1.5 text-[10px]">
        {stages.map((s, idx) => {
          const status = getStageStatus(s.key);
          return (
            <React.Fragment key={s.key}>
              <div title={s.tooltip}>
                {status === "complete" && <CheckCircle2 className="w-2.5 h-2.5 text-green-600" />}
                {status === "active" && <Circle className="w-2.5 h-2.5 text-blue-600" />}
                {status === "withheld" && <XCircle className="w-2.5 h-2.5 text-amber-600" />}
                {status === "pending" && <Circle className="w-2.5 h-2.5 text-slate-300" />}
              </div>
              {idx < stages.length - 1 && <span className="text-slate-400">→</span>}
            </React.Fragment>
          );
        })}
      </div>
      <p className="text-[9px] text-slate-400 mt-0.5">Knowledge → Governance → Experience → Understanding → Reliable Output</p>
    </div>
  );
}