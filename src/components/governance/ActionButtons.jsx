import React from "react";
import { Button } from "@/components/ui/button";
import { Play, FlaskConical, Download, Loader2 } from "lucide-react";

export default function ActionButtons({
  onRun,
  onRunTestSuite,
  onDownloadEvidence,
  isRunning,
  isTestRunning,
  hasEvidence,
}) {
  return (
    <div className="flex flex-wrap gap-3">
      <Button
        onClick={onRun}
        disabled={isRunning || isTestRunning}
        className="bg-slate-900 hover:bg-slate-800 text-white rounded-lg px-5 h-10 text-sm font-medium shadow-sm"
      >
        {isRunning ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Play className="w-4 h-4 mr-2" />
        )}
        Run
      </Button>
      <Button
        onClick={onRunTestSuite}
        disabled={isRunning || isTestRunning}
        variant="outline"
        className="rounded-lg px-5 h-10 text-sm font-medium border-slate-200"
      >
        {isTestRunning ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <FlaskConical className="w-4 h-4 mr-2" />
        )}
        Run Test Suite
      </Button>
      <Button
        onClick={onDownloadEvidence}
        disabled={!hasEvidence}
        variant="outline"
        className="rounded-lg px-5 h-10 text-sm font-medium border-slate-200"
      >
        <Download className="w-4 h-4 mr-2" />
        Download Evidence
      </Button>
    </div>
  );
}