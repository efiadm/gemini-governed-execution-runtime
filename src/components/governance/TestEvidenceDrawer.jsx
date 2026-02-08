import React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Copy, CheckCircle2 } from "lucide-react";

export default function TestEvidenceDrawer({ isOpen, onClose, testData }) {
  const [copied, setCopied] = React.useState(false);

  if (!testData) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(testData, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            {testData.id} Evidence
            <Badge variant="secondary" className="text-xs">{testData.name}</Badge>
          </SheetTitle>
          <SheetDescription>
            Full test execution evidence with validation results
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Prompt */}
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-2">
              Test Prompt
            </span>
            <div className="bg-slate-50 p-4 rounded-lg text-sm text-slate-700 border border-slate-200">
              {testData.prompt}
            </div>
          </div>

          {/* Governed Output */}
          {testData.governedOutput && (
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-2">
                Governed Output (JSON)
              </span>
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopy}
                  className="absolute top-2 right-2 h-7 text-xs z-10"
                >
                  {copied ? (
                    <CheckCircle2 className="w-3 h-3 mr-1 text-green-600" />
                  ) : (
                    <Copy className="w-3 h-3 mr-1" />
                  )}
                  {copied ? "Copied" : "Copy"}
                </Button>
                <pre className="text-xs bg-slate-900 text-slate-100 p-4 rounded-lg overflow-auto max-h-[400px] font-mono">
                  {JSON.stringify(testData.governedOutput, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* Validation Errors */}
          {testData.validationErrors && testData.validationErrors.length > 0 && (
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-2">
                Validation Errors
              </span>
              <ul className="space-y-1">
                {testData.validationErrors.map((err, i) => (
                  <li
                    key={i}
                    className="text-xs text-red-700 bg-red-50 px-3 py-1.5 rounded-lg border border-red-100"
                  >
                    {err}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Evidence Object */}
          {testData.evidence && (
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-2">
                Evidence Record
              </span>
              <pre className="text-xs bg-slate-900 text-slate-100 p-4 rounded-lg overflow-auto max-h-[300px] font-mono">
                {JSON.stringify(testData.evidence, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}