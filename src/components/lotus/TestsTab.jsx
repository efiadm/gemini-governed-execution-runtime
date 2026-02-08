import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, FlaskConical, Eye, Loader2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

export default function TestsTab({ results, isRunning, currentTestId, onRunTestSuite }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedTest, setSelectedTest] = useState(null);

  const handleView = (test) => {
    setSelectedTest(test);
    setDrawerOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">Test Suite</h3>
          <p className="text-xs text-slate-500 mt-1">TS-01 through TS-05 adversarial tests</p>
        </div>
        <Button onClick={onRunTestSuite} disabled={isRunning} size="sm">
          {isRunning ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <FlaskConical className="w-4 h-4 mr-2" />
          )}
          Run Test Suite
        </Button>
      </div>

      {results.length === 0 ? (
        <p className="text-sm text-slate-400 italic text-center py-8">
          No test results yet. Click "Run Test Suite" to execute all tests.
        </p>
      ) : (
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="text-xs font-bold">Test</TableHead>
                <TableHead className="text-center text-xs font-bold">Baseline</TableHead>
                <TableHead className="text-center text-xs font-bold">Governed</TableHead>
                <TableHead className="text-center text-xs font-bold">Hybrid</TableHead>
                <TableHead className="text-center text-xs font-bold">Attempts</TableHead>
                <TableHead className="text-center text-xs font-bold">Latency</TableHead>
                <TableHead className="text-center text-xs font-bold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((test) => (
                <TableRow key={test.id} className={currentTestId === test.id && isRunning ? "bg-blue-50" : ""}>
                  <TableCell className="text-xs font-medium">{test.name}</TableCell>
                  <TableCell className="text-center">
                    {test.baselineResult === "pass" ? (
                      <CheckCircle2 className="w-4 h-4 text-green-600 mx-auto" />
                    ) : test.baselineResult === "fail" ? (
                      <XCircle className="w-4 h-4 text-red-500 mx-auto" />
                    ) : test.baselineResult === "text" ? (
                      <Badge variant="secondary" className="text-[10px]">Text</Badge>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {test.governedResult === "pass" ? (
                      <CheckCircle2 className="w-4 h-4 text-green-600 mx-auto" />
                    ) : test.governedResult === "fail" ? (
                      <XCircle className="w-4 h-4 text-red-500 mx-auto" />
                    ) : test.governedResult === "safe_mode" ? (
                      <Badge className="bg-amber-100 text-amber-800 text-[10px]">Safe</Badge>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {test.hybridResult === "pass" ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" />
                    ) : test.hybridResult === "fail" ? (
                      <XCircle className="w-4 h-4 text-red-500 mx-auto" />
                    ) : test.hybridResult === "safe_mode" ? (
                      <Badge className="bg-amber-100 text-amber-800 text-[10px]">Safe</Badge>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center text-xs font-mono">{test.attempts || "—"}</TableCell>
                  <TableCell className="text-center text-xs font-mono">{test.latency_ms || "—"}ms</TableCell>
                  <TableCell className="text-center">
                    {test.governedResult && (
                      <Button variant="ghost" size="sm" onClick={() => handleView(test)} className="h-7">
                        <Eye className="w-3 h-3 mr-1" />
                        View
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          {selectedTest && (
            <>
              <SheetHeader>
                <SheetTitle>{selectedTest.name}</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-4">
                <div>
                  <h4 className="text-xs font-semibold text-slate-700 mb-2">Prompt</h4>
                  <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded">{selectedTest.prompt}</p>
                </div>
                {selectedTest.governedOutput && (
                  <div>
                    <h4 className="text-xs font-semibold text-slate-700 mb-2">Governed Output</h4>
                    <pre className="text-xs bg-slate-900 text-slate-100 p-3 rounded overflow-auto max-h-[300px]">
                      {JSON.stringify(selectedTest.governedOutput, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}