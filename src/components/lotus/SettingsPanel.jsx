import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Settings, X } from "lucide-react";
import { getSettings, updateSettings, subscribeToSettings } from "./settingsStore";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export default function SettingsPanel() {
  const [open, setOpen] = useState(false);
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
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7">
          <Settings className="w-3 h-3 mr-1" />
          Settings
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>Execution Settings</SheetTitle>
          <SheetDescription>
            Configure repair behavior, output formatting, and audit options.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Repair Cap */}
          <div className="space-y-2">
            <Label htmlFor="repairCap" className="text-sm font-medium">
              Repair Cap
            </Label>
            <Select
              value={String(settings.repairCap)}
              onValueChange={(val) => handleChange("repairCap", parseInt(val))}
            >
              <SelectTrigger id="repairCap">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">0 (No repairs)</SelectItem>
                <SelectItem value="1">1 (Default)</SelectItem>
                <SelectItem value="2">2 (Extended)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Maximum number of repair attempts when validation fails. Default: 1.
            </p>
          </div>

          {/* Output Compactness */}
          <div className="space-y-2">
            <Label htmlFor="outputCompactness" className="text-sm font-medium">
              Output Compactness
            </Label>
            <Select
              value={settings.outputCompactness}
              onValueChange={(val) => handleChange("outputCompactness", val)}
            >
              <SelectTrigger id="outputCompactness">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="compact">Compact</SelectItem>
                <SelectItem value="full">Full</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Controls verbosity of rendered output. Compact is recommended.
            </p>
          </div>

          {/* Audit Enabled */}
          <div className="space-y-2">
            <Label htmlFor="auditEnabled" className="text-sm font-medium">
              Audit Pipeline
              <Badge className="ml-2 bg-primary text-primary-foreground text-[9px]">
                Non-blocking
              </Badge>
            </Label>
            <Select
              value={settings.auditEnabled ? "on" : "off"}
              onValueChange={(val) => handleChange("auditEnabled", val === "on")}
            >
              <SelectTrigger id="auditEnabled">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="on">On (Default)</SelectItem>
                <SelectItem value="off">Off</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Enables async post-execution audits. Audits run after response returned and do not affect execution latency.
            </p>
          </div>

          {/* Audit Depth */}
          {settings.auditEnabled && (
            <div className="space-y-2">
              <Label htmlFor="auditDepth" className="text-sm font-medium">
                Audit Depth
              </Label>
              <Select
                value={settings.auditDepth}
                onValueChange={(val) => handleChange("auditDepth", val)}
              >
                <SelectTrigger id="auditDepth">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="standard">Standard (Default)</SelectItem>
                  <SelectItem value="heavy">Heavy</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Light: Basic heuristics only. Standard: Inline + some analysis. Heavy: Deep drift/hallucination scoring.
              </p>
            </div>
          )}

          {/* Audit Model */}
          {settings.auditEnabled && (
            <div className="space-y-2">
              <Label htmlFor="auditModel" className="text-sm font-medium">
                Audit Model
              </Label>
              <Select
                value={settings.auditModel}
                onValueChange={(val) => handleChange("auditModel", val)}
              >
                <SelectTrigger id="auditModel">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="same">Same as Execution</SelectItem>
                  <SelectItem value="cheaper">Cheaper Model (Default)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Use a cheaper model for audits to reduce cost. Audit metrics are tracked separately.
              </p>
            </div>
          )}

          <div className="pt-4 border-t border-border">
            <div className="text-xs text-muted-foreground space-y-2">
              <p>
                <strong>Execution Path:</strong> Blocking, returns response. Metrics: Billable model work + runtime-local validation/parsing.
              </p>
              <p>
                <strong>Audit Path:</strong> Non-blocking, async after response. Metrics: Separate audit bucket, excluded from execution totals.
              </p>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}