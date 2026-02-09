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
    <Card className="h-full relative z-10 bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-card-foreground">Prompt Input</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label className="text-xs font-semibold text-muted-foreground">Preset Prompts</Label>
          <Select onValueChange={(v) => onPromptChange(PRESET_PROMPTS[v].prompt)} disabled={disabled}>
            <SelectTrigger className="text-sm bg-popover border-input text-popover-foreground focus-visible:ring-ring">
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
          <Label className="text-xs font-semibold text-muted-foreground">Your Prompt</Label>
          <Textarea
            value={prompt}
            onChange={(e) => onPromptChange(e.target.value)}
            placeholder="Enter your prompt here..."
            className="min-h-[200px] text-sm bg-input border-input text-foreground placeholder:text-muted-foreground focus-visible:ring-ring"
            disabled={disabled}
          />
        </div>

        <div className="space-y-3">
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground">Mode</Label>
            <div className="flex gap-2">
              {["baseline", "governed", "hybrid"].map((m) => (
                <button
                  key={m}
                  onClick={() => onModeChange(m)}
                  disabled={disabled}
                  className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                    mode === m 
                      ? 'bg-accent text-accent-foreground' 
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  }`}
                >
                  {m.charAt(0).toUpperCase() + m.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground">Grounding</Label>
            <div className="flex gap-2">
              {["off", "auto", "on"].map((g) => (
                <button
                  key={g}
                  onClick={() => onGroundingChange(g)}
                  disabled={disabled}
                  className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                    grounding === g 
                      ? 'bg-muted text-foreground' 
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  }`}
                >
                  {g.charAt(0).toUpperCase() + g.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground">Model</Label>
            <Select value={model} onValueChange={onModelChange} disabled={disabled}>
              <SelectTrigger className="text-sm bg-popover border-input text-popover-foreground focus-visible:ring-ring">
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
          <Button onClick={onRun} disabled={disabled || !prompt.trim()} className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-ring">
            <Play className="w-4 h-4 mr-2" />
            Run
          </Button>
          <Button variant="outline" onClick={onClear} disabled={disabled} className="flex-1 bg-secondary border-input text-secondary-foreground hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-ring">
            <Trash2 className="w-4 h-4 mr-2" />
            Clear
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}