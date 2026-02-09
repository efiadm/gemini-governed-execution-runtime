import React from "react";
import { CheckCircle2, Circle, XCircle } from "lucide-react";

export default function PipelineStatus({ stage, safeModeApplied, validationPassed }) {
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
    
    // Mark all stages up to current as complete if validation passed at output
    if (validationPassed && stage === "output") {
      return "complete";
    }
    
    // If safe mode applied, mark final stages as contained (green), not failed
    if (safeModeApplied && (stageKey === "understanding" || stageKey === "output")) {
      return "contained";
    }
    
    if (stageIndex < currentIndex) return "complete";
    if (stageIndex === currentIndex) return "active";
    return "pending";
  };

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        {stages.map((s, idx) => {
          const status = getStageStatus(s.key);
          return (
            <React.Fragment key={s.key}>
              <div className="flex items-center gap-1.5 flex-wrap" title={s.tooltip}>
                {status === "complete" && <CheckCircle2 className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />}
                {status === "active" && <Circle className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />}
                {status === "contained" && <CheckCircle2 className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />}
                {status === "pending" && <Circle className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />}
                <span className={`font-medium ${
                  status === "complete" ? "text-green-700" :
                  status === "active" ? "text-blue-700" :
                  status === "contained" ? "text-green-700" :
                  "text-slate-400"
                }`}>
                  {s.label}
                </span>
              </div>
              {idx < stages.length - 1 && <span className="text-slate-400 flex-shrink-0">→</span>}
            </React.Fragment>
          );
        })}
      </div>
      <p className="text-[9px] text-slate-500 mt-1.5 font-medium">Pipeline: Knowledge → Governance → Experience → Understanding → Reliable Output</p>
    </div>
  );
}