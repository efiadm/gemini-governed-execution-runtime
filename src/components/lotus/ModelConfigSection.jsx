import React, { useEffect, useMemo, useRef, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getModelConfig, updateModelConfig, subscribeToModelConfig } from "./modelConfigStore";

function normalizeModels(payload) {
  const pickId = (m) => (m?.id ?? m?.name ?? (typeof m === "string" ? m : null));
  if (Array.isArray(payload)) return payload.map(pickId).filter(Boolean);
  if (Array.isArray(payload?.data)) return payload.data.map(pickId).filter(Boolean);
  if (Array.isArray(payload?.models)) return payload.models.map(pickId).filter(Boolean);
  // Some providers nest under {object:"list", data:[...]}
  if (payload?.object === "list" && Array.isArray(payload?.data)) return payload.data.map(pickId).filter(Boolean);
  return [];
}

export default function ModelConfigSection() {
  const [cfg, setCfg] = useState(getModelConfig());
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    const unsub = subscribeToModelConfig(setCfg);
    return unsub;
  }, []);

  const canFetch = useMemo(() => cfg.baseUrl?.trim() && cfg.apiKey?.trim(), [cfg.baseUrl, cfg.apiKey]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    // Debounce to avoid fetching on every keystroke
    debounceRef.current = setTimeout(async () => {
      if (!canFetch) {
        setModels([]);
        // Clear selected model if no creds
        if (cfg.selectedModel) updateModelConfig({ selectedModel: "" });
        return;
      }
      setLoading(true);
      const url = `${cfg.baseUrl.replace(/\/+$/, "")}/v1/models`;
      try {
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${cfg.apiKey}` },
        });
        const data = await res.json().catch(() => ({}));
        const list = normalizeModels(data);
        setModels(list);
        // Reset selection if not present in list
        if (cfg.selectedModel && !list.includes(cfg.selectedModel)) {
          updateModelConfig({ selectedModel: "" });
        }
      } catch (e) {
        console.warn("Failed to fetch models", e);
        setModels([]);
        if (cfg.selectedModel) updateModelConfig({ selectedModel: "" });
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(debounceRef.current);
  }, [cfg.baseUrl, cfg.apiKey]);

  return (
    <div className="border-t border-slate-200 pt-3 mt-3">
      <div className="mb-2">
        <Label className="text-xs font-medium text-slate-700">Models</Label>
        <p className="text-[10px] text-slate-500">Connect to your provider, select a model, and set manual pricing for UI cost calcs.</p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs text-slate-700">API Key</Label>
          <Input
            type="password"
            value={cfg.apiKey}
            onChange={(e) => updateModelConfig({ apiKey: e.target.value })}
            placeholder="sk-..."
            className="h-8"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-slate-700">Base URL</Label>
          <Input
            type="text"
            value={cfg.baseUrl}
            onChange={(e) => updateModelConfig({ baseUrl: e.target.value })}
            placeholder="https://api.your-llm.com"
            className="h-8"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-slate-700">Model</Label>
          <Select
            value={cfg.selectedModel || ""}
            onValueChange={(val) => updateModelConfig({ selectedModel: val })}
            disabled={loading || !canFetch || models.length === 0}
          >
            <SelectTrigger className="h-8 disabled:opacity-60">
              <SelectValue placeholder={
                !canFetch ? "Enter Base URL & API Key" : (loading ? "Loading models..." : (models.length ? "Select a model" : "No models found"))
              } />
            </SelectTrigger>
            <SelectContent>
              {models.map((m) => (
                <SelectItem key={m} value={m}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-slate-700">Cost ($ / 1M tokens)</Label>
          <Input
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            value={Number.isFinite(cfg.pricePer1M) ? String(cfg.pricePer1M) : "0"}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              updateModelConfig({ pricePer1M: Number.isFinite(v) && v >= 0 ? v : 0 });
            }}
            placeholder="e.g. 3.00"
            className="h-8"
          />
          <p className="text-[10px] text-slate-500">Used only in frontend cost calculations. Not sent to the LLM.</p>
        </div>
      </div>
    </div>
  );
}