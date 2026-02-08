import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Settings } from "lucide-react";
import { getSettings, updateSettings, subscribeToSettings } from "./settingsStore";

export default function SettingsPanel() {
  const [settings, setSettings] = useState(getSettings());
  const [open, setOpen] = useState(false);

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
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="fixed right-6 bottom-6 h-12 w-12 rounded-full shadow-lg z-50 bg-white hover:bg-slate-50">
          <Settings className="w-5 h-5 text-slate-700" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[400px] sm:w-[500px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Execution & Audit Settings
          </SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-4">
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
      </SheetContent>
    </Sheet>
  );
}