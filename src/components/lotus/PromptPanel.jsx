import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Play, Trash2, FlaskConical } from "lucide-react";

import { PRESET_PROMPTS, PRESET_CATEGORIES } from "./presets";
import { getModelConfig, updateModelConfig, subscribeToModelConfig } from "./modelConfigStore";

function normalizeModels(payload) {
  const pickId = (m) => (m?.id ?? m?.name ?? (typeof m === "string" ? m : null));
  if (Array.isArray(payload)) return payload.map(pickId).filter(Boolean);
  if (Array.isArray(payload?.data)) return payload.data.map(pickId).filter(Boolean);
  if (Array.isArray(payload?.models)) return payload.models.map(pickId).filter(Boolean);
  if (payload?.object === "list" && Array.isArray(payload?.data)) return payload.data.map(pickId).filter(Boolean);
  return [];
}

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

  // Price per 1M tokens (frontend-only) from global modelConfigStore
  const [pricePer1M, setPricePer1M] = React.useState(() => {
    const v = getModelConfig().pricePer1M;
    return Number.isFinite(v) && v >= 0 ? v : 2.0;
  });
  const [priceInput, setPriceInput] = React.useState(() => {
    const v = getModelConfig().pricePer1M;
    if (!(Number.isFinite(v) && v >= 0)) return "2.0";
    return v === 2 || v === 2.0 ? "2.0" : String(v);
  });

  React.useEffect(() => {
    const unsub = subscribeToModelConfig((cfg) => {
      const v = cfg?.pricePer1M;
      setPricePer1M(Number.isFinite(v) && v >= 0 ? v : 2.0);
      // Do not sync priceInput here to avoid interrupting typing
    });
    return unsub;
  }, []);

  // API/Base URL + dynamic models fetching
  const [apiKey, setApiKey] = React.useState(getModelConfig().apiKey || "");
  const [baseUrl, setBaseUrl] = React.useState(getModelConfig().baseUrl || "");
  const [models, setModels] = React.useState([]);
  const [loadingModels, setLoadingModels] = React.useState(false);
  const debounceRef = React.useRef(null);

  React.useEffect(() => {
    const unsub = subscribeToModelConfig((cfg) => {
      setApiKey(cfg?.apiKey || "");
      setBaseUrl(cfg?.baseUrl || "");
    });
    return unsub;
  }, []);

  React.useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      if (!baseUrl?.trim() || !apiKey?.trim()) {
        setModels([]);
        return;
      }
      setLoadingModels(true);
      const url = `${baseUrl.replace(/\/+$/, "")}/v1/models`;
      try {
        const res = await fetch(url, { headers: { Authorization: `Bearer ${apiKey}` } });
        const data = await res.json().catch(() => ({}));
        const list = normalizeModels(data);
        setModels(list);
        if (model && !list.includes(model)) {
          onModelChange("");
          updateModelConfig({ selectedModel: "" });
        }
      } catch (e) {
        console.warn("Failed to fetch models", e);
        setModels([]);
        if (model) {
          onModelChange("");
          updateModelConfig({ selectedModel: "" });
        }
      } finally {
        setLoadingModels(false);
      }
    }, 400);

    return () => clearTimeout(debounceRef.current);
  }, [baseUrl, apiKey]);

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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5 max-w-md">
              <Label className="text-xs font-semibold text-slate-500">API Key</Label>
              <Input
                type="password"
                value={apiKey}
                onChange={(e) => {
                  const v = e.target.value;
                  setApiKey(v);
                  updateModelConfig({ apiKey: v });
                }}
                placeholder="sk-..."
                className="h-8 text-sm"
                disabled={disabled}
              />
            </div>

            <div className="space-y-1.5 max-w-md">
              <Label className="text-xs font-semibold text-slate-500">Base URL</Label>
              <Input
                type="text"
                value={baseUrl}
                onChange={(e) => {
                  const v = e.target.value;
                  setBaseUrl(v);
                  updateModelConfig({ baseUrl: v });
                }}
                placeholder="https://api.your-llm.com"
                className="h-8 text-sm"
                disabled={disabled}
              />
            </div>

            <div className="space-y-1.5 max-w-md">
              <Label className="text-xs font-semibold text-slate-500">Model</Label>
              <Select
                value={model || ""}
                onValueChange={(val) => {
                  onModelChange(val);
                  updateModelConfig({ selectedModel: val });
                }}
                disabled={disabled || loadingModels || models.length === 0}
              >
                <SelectTrigger className="h-8 text-sm disabled:opacity-60">
                  <SelectValue placeholder={
                    !baseUrl?.trim() || !apiKey?.trim()
                      ? "Enter Base URL & API Key"
                      : (loadingModels ? "Loading models..." : (models.length ? "Select a model" : "No models found"))
                  } />
                </SelectTrigger>
                <SelectContent>
                  {models.map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5 max-w-md">
              <Label className="text-xs font-semibold text-slate-500">Cost ($ / 1M tokens)</Label>
              <Input
                type="text"
                inputMode="decimal"
                value={priceInput}
                onChange={(e) => {
                  const raw = e.target.value;
                  // Allow only digits and a single optional decimal point; allow empty
                  if (raw === "" || /^[0-9]*\.?[0-9]*$/.test(raw)) {
                    setPriceInput(raw);
                    const parsed = parseFloat(raw);
                    if (Number.isFinite(parsed) && parsed >= 0) {
                      setPricePer1M(parsed);
                      updateModelConfig({ pricePer1M: parsed });
                    }
                  }
                }}
                disabled={disabled}
                placeholder="2.0"
                className="h-8 text-sm"
              />
            </div>
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