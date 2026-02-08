import React, { useState, useEffect, useRef } from "react";
import { AlertTriangle, Activity, Minimize2, Maximize2, GripVertical } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const STORAGE_KEY_EXPANDED = "lotus.telemetry.expanded";
const STORAGE_KEY_POSITION = "lotus.telemetry.position";

export default function TruncationWidget({ truncationRisk, metrics, mode }) {
  const [isExpanded, setIsExpanded] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(STORAGE_KEY_EXPANDED) === "true";
  });
  const [position, setPosition] = useState(() => {
    if (typeof window === "undefined") return { bottom: 24, right: 24 };
    const saved = localStorage.getItem(STORAGE_KEY_POSITION);
    return saved ? JSON.parse(saved) : { bottom: 24, right: 24 };
  });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const widgetRef = useRef(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY_EXPANDED, isExpanded.toString());
    }
  }, [isExpanded]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY_POSITION, JSON.stringify(position));
    }
  }, [position]);

  const handleMouseDown = (e) => {
    if (e.target.closest("button")) return;
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX - (position.left || window.innerWidth - position.right - (isExpanded ? 256 : 120)),
      y: e.clientY - (position.top || window.innerHeight - position.bottom - (isExpanded ? 280 : 48)),
    };
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    
    const newX = e.clientX - dragStartRef.current.x;
    const newY = e.clientY - dragStartRef.current.y;
    
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const widgetWidth = isExpanded ? 256 : 120;
    const widgetHeight = isExpanded ? 280 : 48;

    // Dock to corners if close
    const snapThreshold = 50;
    let newPos = {};

    if (newX < snapThreshold && newY < snapThreshold) {
      // Top-left
      newPos = { top: 80, left: 24, bottom: undefined, right: undefined };
    } else if (newX > windowWidth - widgetWidth - snapThreshold && newY < snapThreshold) {
      // Top-right
      newPos = { top: 80, right: 24, bottom: undefined, left: undefined };
    } else if (newX < snapThreshold && newY > windowHeight - widgetHeight - snapThreshold) {
      // Bottom-left
      newPos = { bottom: 24, left: 24, top: undefined, right: undefined };
    } else if (newX > windowWidth - widgetWidth - snapThreshold && newY > windowHeight - widgetHeight - snapThreshold) {
      // Bottom-right (default)
      newPos = { bottom: 24, right: 24, top: undefined, left: undefined };
    } else {
      // Free position
      newPos = {
        left: Math.max(0, Math.min(windowWidth - widgetWidth, newX)),
        top: Math.max(80, Math.min(windowHeight - widgetHeight, newY)),
        bottom: undefined,
        right: undefined,
      };
    }

    setPosition(newPos);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, isExpanded]);

  if (!metrics) return null;

  const positionStyle = {
    ...(position.top !== undefined && { top: `${position.top}px` }),
    ...(position.bottom !== undefined && { bottom: `${position.bottom}px` }),
    ...(position.left !== undefined && { left: `${position.left}px` }),
    ...(position.right !== undefined && { right: `${position.right}px` }),
  };

  return (
    <div
      ref={widgetRef}
      className={`fixed z-50 pointer-events-none transition-all ${isDragging ? "cursor-grabbing" : ""}`}
      style={positionStyle}
    >
      <div
        className={`bg-slate-900 text-white rounded-xl shadow-2xl pointer-events-auto ${
          isExpanded ? "w-64 p-4" : "w-auto px-4 py-2"
        } ${isDragging ? "shadow-2xl scale-105" : ""}`}
        onMouseDown={handleMouseDown}
        style={{ cursor: isDragging ? "grabbing" : "grab" }}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              {isExpanded ? "Live Telemetry" : "Telemetry"}
            </span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="text-slate-400 hover:text-white transition-colors pointer-events-auto"
          >
            {isExpanded ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
          </button>
        </div>

        {isExpanded ? (
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400">Truncation Risk</span>
                <Badge className={`text-[10px] ${
                  truncationRisk > 75 ? "bg-red-500/20 text-red-300" :
                  truncationRisk > 50 ? "bg-amber-500/20 text-amber-300" :
                  "bg-green-500/20 text-green-300"
                }`}>
                  {truncationRisk}%
                </Badge>
              </div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    truncationRisk > 75 ? "bg-red-500" :
                    truncationRisk > 50 ? "bg-amber-500" :
                    "bg-green-500"
                  }`}
                  style={{ width: `${truncationRisk}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-400">Tokens In</span>
                <p className="font-mono text-white">{metrics.billable?.prompt_tokens_in || 0}</p>
              </div>
              <div>
                <span className="text-slate-400">Tokens Out</span>
                <p className="font-mono text-white">{metrics.billable?.completion_tokens_out || 0}</p>
              </div>
            </div>

            {mode === "hybrid" && metrics.hybrid_tokens_saved > 0 && (
              <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-lg p-2">
                <p className="text-xs text-emerald-300">Tokens Saved: ~{metrics.hybrid_tokens_saved}</p>
              </div>
            )}

            {truncationRisk > 75 && (
              <div className="flex items-center gap-1.5 text-xs text-red-300">
                <AlertTriangle className="w-3 h-3" />
                <span>High truncation risk</span>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs">
            <Badge className={`text-[10px] ${
              truncationRisk > 75 ? "bg-red-500/20 text-red-300" :
              truncationRisk > 50 ? "bg-amber-500/20 text-amber-300" :
              "bg-green-500/20 text-green-300"
            }`}>
              {truncationRisk}%
            </Badge>
            <span className="text-slate-400 font-mono">
              {metrics.billable?.total_model_tokens || 0}t
            </span>
          </div>
        )}
      </div>
    </div>
  );
}