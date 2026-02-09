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
    <Card className="h-full relative z-10" style={{ backgroundColor: '#0b0f0d', borderColor: 'rgba(231, 240, 234, 0.10)', boxShadow: '0 1px 0 rgba(255,255,255,0.04) inset, 0 10px 30px rgba(0,0,0,0.45)' }}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold" style={{ color: '#e7f0ea' }}>Prompt Input</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label className="text-xs font-semibold" style={{ color: '#8ea597' }}>Preset Prompts</Label>
          <Select onValueChange={(v) => onPromptChange(PRESET_PROMPTS[v].prompt)} disabled={disabled}>
            <SelectTrigger className="text-sm" style={{ backgroundColor: 'rgba(11, 15, 13, 0.95)', borderColor: 'rgba(231,240,234,0.18)', color: '#e7f0ea' }}>
              <SelectValue placeholder="Select preset..." />
            </SelectTrigger>
            <SelectContent className="max-h-[400px]" style={{ backgroundColor: '#0f1512', borderColor: 'rgba(231, 240, 234, 0.10)', boxShadow: '0 10px 30px rgba(0,0,0,0.45)' }}>
              {Object.entries(PRESET_CATEGORIES).map(([catKey, catLabel]) => (
                <React.Fragment key={catKey}>
                  <div className="px-2 py-1.5 text-xs font-semibold" style={{ color: '#8ea597', backgroundColor: 'rgba(19,27,22,0.95)' }}>{catLabel}</div>
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
          <Label className="text-xs font-semibold" style={{ color: '#8ea597' }}>Your Prompt</Label>
          <Textarea
            value={prompt}
            onChange={(e) => onPromptChange(e.target.value)}
            placeholder="Enter your prompt here..."
            className="min-h-[200px] text-sm"
            style={{ backgroundColor: 'rgba(11, 15, 13, 0.95)', borderColor: 'rgba(231,240,234,0.18)', color: '#e7f0ea' }}
            disabled={disabled}
          />
        </div>

        <div className="space-y-3">
          <div className="space-y-2">
            <Label className="text-xs font-semibold" style={{ color: '#8ea597' }}>Mode</Label>
            <div className="flex gap-2">
              {["baseline", "governed", "hybrid"].map((m) => (
                <button
                  key={m}
                  onClick={() => onModeChange(m)}
                  disabled={disabled}
                  style={mode === m ? { 
                    background: 'linear-gradient(180deg, rgba(31,138,92,0.95), rgba(26,111,75,0.95))',
                    borderColor: 'rgba(45,179,122,0.35)',
                    color: '#e7f0ea',
                    boxShadow: '0 0 0 2px rgba(45,179,122,0.10) inset'
                  } : { 
                    backgroundColor: '#0f1512',
                    borderColor: 'rgba(231, 240, 234, 0.10)',
                    color: '#8ea597',
                    boxShadow: '0 1px 0 rgba(255,255,255,0.04) inset'
                  }}
                  className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-all disabled:opacity-50`}
                  onMouseEnter={(e) => mode !== m && (e.currentTarget.style.backgroundColor = '#131b16')}
                  onMouseLeave={(e) => mode !== m && (e.currentTarget.style.backgroundColor = '#0f1512')}
                >
                  {m.charAt(0).toUpperCase() + m.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold" style={{ color: '#8ea597' }}>Grounding</Label>
            <div className="flex gap-2">
              {["off", "auto", "on"].map((g) => (
                <button
                  key={g}
                  onClick={() => onGroundingChange(g)}
                  disabled={disabled}
                  style={grounding === g ? { 
                    backgroundColor: '#131b16',
                    borderColor: 'rgba(231, 240, 234, 0.16)',
                    color: '#e7f0ea',
                    boxShadow: '0 1px 0 rgba(255,255,255,0.04) inset'
                  } : { 
                    backgroundColor: '#0f1512',
                    borderColor: 'rgba(231, 240, 234, 0.10)',
                    color: '#8ea597',
                    boxShadow: '0 1px 0 rgba(255,255,255,0.04) inset'
                  }}
                  className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-all disabled:opacity-50`}
                  onMouseEnter={(e) => grounding !== g && (e.currentTarget.style.backgroundColor = '#131b16')}
                  onMouseLeave={(e) => grounding !== g && (e.currentTarget.style.backgroundColor = '#0f1512')}
                >
                  {g.charAt(0).toUpperCase() + g.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold" style={{ color: '#8ea597' }}>Model</Label>
            <Select value={model} onValueChange={onModelChange} disabled={disabled}>
              <SelectTrigger className="text-sm" style={{ backgroundColor: 'rgba(11, 15, 13, 0.95)', borderColor: 'rgba(231,240,234,0.18)', color: '#e7f0ea', boxShadow: '0 0 0 1px rgba(45,179,122,0.10) inset, 0 1px 0 rgba(255,255,255,0.04) inset' }}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent style={{ backgroundColor: '#0f1512', borderColor: 'rgba(231, 240, 234, 0.10)', boxShadow: '0 10px 30px rgba(0,0,0,0.45)' }}>
                {MODELS_REGISTRY.map((m) => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button 
            onClick={onRun} 
            disabled={disabled || !prompt.trim()} 
            className="flex-1" 
            style={{ 
              background: 'linear-gradient(180deg, rgba(31,138,92,0.95), rgba(26,111,75,0.95))',
              borderColor: 'rgba(45,179,122,0.35)',
              color: '#e7f0ea',
              boxShadow: '0 10px 26px rgba(0,0,0,0.45), 0 0 0 2px rgba(45,179,122,0.10) inset'
            }} 
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 10px 26px rgba(0,0,0,0.45), 0 0 0 2px rgba(45,179,122,0.16) inset, 0 0 0 6px rgba(45,179,122,0.10)';
            }} 
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 10px 26px rgba(0,0,0,0.45), 0 0 0 2px rgba(45,179,122,0.10) inset';
            }}
          >
            <Play className="w-4 h-4 mr-2" />
            Run
          </Button>
          <Button 
            variant="outline" 
            onClick={onClear} 
            disabled={disabled} 
            className="flex-1" 
            style={{ 
              backgroundColor: '#0f1512',
              borderColor: 'rgba(231, 240, 234, 0.10)',
              color: '#8ea597',
              boxShadow: '0 1px 0 rgba(255,255,255,0.04) inset'
            }} 
            onMouseEnter={(e) => { 
              e.currentTarget.style.backgroundColor = '#131b16';
              e.currentTarget.style.borderColor = 'rgba(231, 240, 234, 0.16)';
            }} 
            onMouseLeave={(e) => { 
              e.currentTarget.style.backgroundColor = '#0f1512';
              e.currentTarget.style.borderColor = 'rgba(231, 240, 234, 0.10)';
            }}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}