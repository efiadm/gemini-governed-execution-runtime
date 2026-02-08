import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Lightbulb, 
  RotateCcw, 
  Settings, 
  FileDown, 
  AlertCircle,
  CheckCircle2,
  TrendingUp
} from "lucide-react";

function NextStepItem({ icon: Icon, title, description, action, variant = "default" }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200">
      <Icon className={`w-4 h-4 mt-0.5 ${
        variant === "success" ? "text-green-600" :
        variant === "warning" ? "text-amber-600" :
        variant === "error" ? "text-red-600" :
        "text-blue-600"
      }`} />
      <div className="flex-1 min-w-0">
        <div className="text-xs font-semibold text-slate-800 mb-0.5">{title}</div>
        <div className="text-xs text-slate-600">{description}</div>
      </div>
      {action && (
        <Button variant="ghost" size="sm" className="h-7 text-xs flex-shrink-0">
          {action}
        </Button>
      )}
    </div>
  );
}

export default function NextStepsPanel({ evidence, validation, mode }) {
  if (!evidence && !validation) {
    return (
      <Card className="border-slate-200 shadow-sm rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <Lightbulb className="w-4 h-4" />
            Next Steps
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-400 italic">
            Run a prompt to see actionable recommendations.
          </p>
        </CardContent>
      </Card>
    );
  }

  const steps = [];
  const safeModeApplied = evidence?.safe_mode_applied;
  const validationPassed = validation?.passed;
  const repairs = evidence?.repairs || 0;
  const latency = evidence?.latency_ms || 0;

  // Success case
  if (validationPassed && !safeModeApplied) {
    steps.push({
      icon: CheckCircle2,
      variant: "success",
      title: "Validation Passed",
      description: "Output meets all governance requirements. Ready for production use.",
    });
  }

  // Safe mode warning
  if (safeModeApplied) {
    steps.push({
      icon: AlertCircle,
      variant: "error",
      title: "Safe Mode Activated",
      description: "Model couldn't satisfy contract after maximum repairs. Review evidence panel for details.",
      action: "View Evidence",
    });
    steps.push({
      icon: RotateCcw,
      variant: "warning",
      title: "Retry with Simpler Prompt",
      description: "Reduce adversarial instructions and conflicting requirements in your prompt.",
    });
  }

  // High repair count
  if (repairs >= 2 && !safeModeApplied) {
    steps.push({
      icon: AlertCircle,
      variant: "warning",
      title: "Multiple Repairs Required",
      description: `${repairs} repair attempts needed. Consider simplifying your prompt or adjusting grounding.`,
    });
  }

  // Performance optimization
  if (latency > 10000) {
    steps.push({
      icon: TrendingUp,
      variant: "default",
      title: "High Latency Detected",
      description: "Consider using Hybrid mode for faster results with maintained governance.",
      action: "Switch to Hybrid",
    });
  }

  // Grounding suggestion
  if (mode === "governed" && repairs === 0 && validationPassed) {
    steps.push({
      icon: Settings,
      variant: "default",
      title: "Optimize Performance",
      description: "Your prompt works well. Try Hybrid mode to reduce latency by ~30-40%.",
    });
  }

  // Evidence download
  if (evidence) {
    steps.push({
      icon: FileDown,
      variant: "default",
      title: "Download Evidence",
      description: "Export complete evidence record with all validation attempts and repairs.",
      action: "Download",
    });
  }

  // Default suggestions if no specific issues
  if (steps.length === 0) {
    steps.push({
      icon: Lightbulb,
      variant: "default",
      title: "General Tips",
      description: "Use grounding=auto for factual queries. Keep prompts focused and avoid conflicting instructions.",
    });
  }

  return (
    <Card className="border-slate-200 shadow-sm rounded-2xl">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <Lightbulb className="w-4 h-4" />
            Next Steps
          </CardTitle>
          {validationPassed && !safeModeApplied && (
            <Badge className="bg-green-100 text-green-700 text-xs">
              Ready for Production
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {steps.map((step, i) => (
          <NextStepItem key={i} {...step} />
        ))}
      </CardContent>
    </Card>
  );
}