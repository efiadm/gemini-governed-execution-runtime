import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Play, Trash2, FlaskConical } from "lucide-react";
import { MODELS_REGISTRY } from "./modelsRegistry";
import { PRESET_PROMPTS, PRESET_CATEGORIES } from "./presets";

export default function PromptPanel({
  prompt,
  onPromptChange,
  mode,
  onModeChange,
  grounding,
  onGroundingChange,
  model,
  onModelChange,
  presets,
  onRun,
  onClear,
  isRunning,
  isTestRunning,
}) {
  const disabled = isRunning || isTestRunning;

  return (
    <Card className="border-slate-200 shadow-sm h-full relative z-10">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-slate-700">Prompt Input</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label className="text-xs font-semibold text-slate-500">Preset Prompts</Label>
          <Select onValueChange={(v) => onPromptChange(PRESET_PROMPTS[v].prompt)} disabled={disabled}>
            <SelectTrigger className="text-sm">
              <SelectValue placeholder="Select preset..." />
            </SelectTrigger>
            <SelectContent className="max-h-[400px]">
              {Object.entries(PRESET_CATEGORIES).map(([catKey, catLabel]) => (
                <React.Fragment key={catKey}>
                  <div className="px-2 py-1.5 text-xs font-semibold text-slate-600 bg-slate-50">{catLabel}</div>
                  {Object.entries(PRESET_PROMPTS)
                    .filter(([_, preset]) => preset.category === catKey)
                    .map(([key, preset]) => (
                      <SelectItem key={key} value={key} className="pl-6">{preset.name}</SelectItem>
                    ))}
                </React.Fragment>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-semibold text-slate-500">Your Prompt</Label>
          <Textarea
            value={prompt}
            onChange={(e) => onPromptChange(e.target.value)}
            placeholder="Enter your prompt here..."
            className="min-h-[200px] text-sm"
            disabled={disabled}
          />
        </div>

        <div className="space-y-3">
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-slate-500">Mode</Label>
            <div className="flex gap-2">
              {["baseline", "governed", "hybrid"].map((m) => (
                <button
                  key={m}
                  onClick={() => onModeChange(m)}
                  disabled={disabled}
                  className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-all ${
                    mode === m
                      ? "bg-violet-600 text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  } disabled:opacity-50`}
                >
                  {m.charAt(0).toUpperCase() + m.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold text-slate-500">Grounding</Label>
            <div className="flex gap-2">
              {["off", "auto", "on"].map((g) => (
                <button
                  key={g}
                  onClick={() => onGroundingChange(g)}
                  disabled={disabled}
                  className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-all ${
                    grounding === g
                      ? "bg-slate-900 text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  } disabled:opacity-50`}
                >
                  {g.charAt(0).toUpperCase() + g.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold text-slate-500">Model</Label>
            <Select value={model} onValueChange={onModelChange} disabled={disabled}>
              <SelectTrigger className="text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MODELS_REGISTRY.map((m) => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button onClick={onRun} disabled={disabled || !prompt.trim()} className="flex-1 bg-violet-600 hover:bg-violet-700">
            <Play className="w-4 h-4 mr-2" />
            Run
          </Button>
          <Button variant="outline" onClick={onClear} disabled={disabled} className="flex-1">
            <Trash2 className="w-4 h-4 mr-2" />
            Clear
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}