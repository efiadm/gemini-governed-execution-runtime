import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Settings } from "lucide-react";
import { getSettings, updateSettings, subscribeToSettings } from "./settingsStore";

export default function SettingsPanel() {
  const [settings, setSettings] = useState(getSettings());

  useEffect(() => {
    const unsubscribe = subscribeToSettings((newSettings) => {
      setSettings(newSettings);
    });
    return unsubscribe;
  }, []);

  const handleChange = (key, value) => {
    updateSettings({ [key]: value });
  };

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-slate-600" />
          <CardTitle className="text-sm font-semibold text-slate-700">Execution & Audit Settings</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label className="text-xs font-medium text-slate-700">Repair Cap (Execution)</Label>
          <Select
            value={settings.repairCap.toString()}
            onValueChange={(val) => handleChange("repairCap", parseInt(val))}
          >
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">0 (No repairs)</SelectItem>
              <SelectItem value="1">1 (Default, fast)</SelectItem>
              <SelectItem value="2">2 (Thorough)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-[10px] text-slate-500">Max model repair attempts before safe mode</p>
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-medium text-slate-700">Output Compactness</Label>
          <Select
            value={settings.outputCompactness}
            onValueChange={(val) => handleChange("outputCompactness", val)}
          >
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="compact">Compact (fewer fields)</SelectItem>
              <SelectItem value="full">Full (all details)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="border-t border-slate-200 pt-3 mt-3">
          <div className="flex items-center justify-between mb-2">
            <Label className="text-xs font-medium text-slate-700">Enable Audit Path</Label>
            <Switch
              checked={settings.auditEnabled}
              onCheckedChange={(val) => handleChange("auditEnabled", val)}
            />
          </div>
          <p className="text-[10px] text-slate-500 mb-3">
            Async analysis after execution completes (non-blocking, excluded from execution metrics)
          </p>

          {settings.auditEnabled && (
            <>
              <div className="space-y-2 mt-3">
                <Label className="text-xs font-medium text-slate-700">Audit Depth</Label>
                <Select
                  value={settings.auditDepth}
                  onValueChange={(val) => handleChange("auditDepth", val)}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue />
                    </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light (structure checks only)</SelectItem>
                    <SelectItem value="standard">Standard (+ drift analysis)</SelectItem>
                    <SelectItem value="heavy">Heavy (+ model calls)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 mt-3">
                <Label className="text-xs font-medium text-slate-700">Audit Model</Label>
                <Select
                  value={settings.auditModel}
                  onValueChange={(val) => handleChange("auditModel", val)}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cheaper">Cheaper (Flash)</SelectItem>
                    <SelectItem value="same">Same as execution</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-slate-500">Only used for heavy audit depth</p>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}