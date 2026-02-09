import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, FlaskConical, Eye, Loader2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
          <h3 className="text-sm font-semibold text-foreground">Test Suite</h3>
          <p className="text-xs text-muted-foreground mt-1">TS-01 through TS-05 adversarial tests</p>
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
        <p className="text-sm text-muted-foreground italic text-center py-8">
          No test results yet. Click "Run Test Suite" to execute all tests.
        </p>
      ) : (
        <div className="surface overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted">
                <TableHead className="text-xs font-bold text-foreground">Test</TableHead>
                <TableHead className="text-center text-xs font-bold text-foreground">Baseline</TableHead>
                <TableHead className="text-center text-xs font-bold text-foreground">Governed</TableHead>
                <TableHead className="text-center text-xs font-bold text-foreground">Hybrid</TableHead>
                <TableHead className="text-center text-xs font-bold text-foreground">Attempts</TableHead>
                <TableHead className="text-center text-xs font-bold text-foreground">Latency</TableHead>
                <TableHead className="text-center text-xs font-bold text-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((test) => (
                <TableRow key={test.id} className={currentTestId === test.id && isRunning ? "bg-primary/10" : ""}>
                  <TableCell className="text-xs font-medium">{test.name}</TableCell>
                  <TableCell className="text-center">
                    {test.baselineResult === "pass" ? (
                      <CheckCircle2 className="w-4 h-4 text-green-600 mx-auto" />
                    ) : test.baselineResult === "fail" ? (
                      <XCircle className="w-4 h-4 text-red-500 mx-auto" />
                    ) : test.baselineResult === "text" ? (
                      <Badge variant="secondary" className="text-[10px]">Text</Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {test.governedResult === "pass" ? (
                      <CheckCircle2 className="w-4 h-4 text-green-600 mx-auto" />
                    ) : test.governedResult === "fail" ? (
                      <XCircle className="w-4 h-4 text-red-500 mx-auto" />
                    ) : test.governedResult === "safe_mode" ? (
                      <Badge className="bg-amber-600 text-white text-[10px]">Safe</Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {test.hybridResult === "pass" ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" />
                    ) : test.hybridResult === "fail" ? (
                      <XCircle className="w-4 h-4 text-red-500 mx-auto" />
                    ) : test.hybridResult === "safe_mode" ? (
                      <Badge className="bg-amber-600 text-white text-[10px]">Safe</Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
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
        <SheetContent className="w-full sm:max-w-3xl overflow-y-auto">
          {selectedTest && (
            <>
              <SheetHeader>
                <SheetTitle className="text-base">{selectedTest.name}</SheetTitle>
              </SheetHeader>
              <div className="mt-6">
                <Tabs defaultValue="overview">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="attempts">Attempts</TabsTrigger>
                    <TabsTrigger value="raw">Raw Output</TabsTrigger>
                    <TabsTrigger value="validation">Validation</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="space-y-4 mt-4">
                    <div>
                      <h4 className="text-sm font-semibold text-foreground mb-2">Prompt</h4>
                      <p className="text-xs text-muted-foreground bg-muted p-3 rounded border border-border">
                        {selectedTest.prompt}
                      </p>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-xs">
                      <div className="bg-card rounded p-3 border border-border">
                        <p className="text-muted-foreground mb-1">Attempts</p>
                        <p className="text-lg font-bold text-foreground">{selectedTest.attempts || 0}</p>
                      </div>
                      <div className="bg-card rounded p-3 border border-border">
                        <p className="text-muted-foreground mb-1">Repairs</p>
                        <p className="text-lg font-bold text-foreground">{selectedTest.repairs || 0}</p>
                      </div>
                      <div className="bg-card rounded p-3 border border-border">
                        <p className="text-muted-foreground mb-1">Latency</p>
                        <p className="text-lg font-bold text-foreground">{selectedTest.latency_ms || 0}ms</p>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="attempts" className="mt-4">
                    {selectedTest.governedEvidence?.attemptDetails && selectedTest.governedEvidence.attemptDetails.length > 0 ? (
                      <div className="space-y-3">
                        {selectedTest.governedEvidence.attemptDetails.map((att, i) => (
                          <div key={i} className="border border-border rounded-lg p-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {att.ok ? (
                                  <CheckCircle2 className="w-4 h-4 text-primary" />
                                ) : (
                                  <XCircle className="w-4 h-4 text-destructive" />
                                )}
                                <span className="text-xs font-medium text-foreground">
                                  Attempt {att.attempt} ({att.kind})
                                </span>
                              </div>
                              <div className="flex gap-2 text-xs text-muted-foreground">
                                <span>Model: {att.model_ms}ms</span>
                                <span>App: {att.local_ms}ms</span>
                              </div>
                            </div>
                            {att.errors?.length > 0 && (
                              <div className="text-xs text-destructive bg-destructive/10 p-2 rounded">
                                {att.errors.join(", ")}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-400 italic">No attempt details available</p>
                    )}
                  </TabsContent>

                  <TabsContent value="raw" className="mt-4">
                    <pre className="text-xs bg-slate-900 text-slate-100 p-4 rounded overflow-auto max-h-[500px]">
                      {JSON.stringify(selectedTest.governedOutput || {}, null, 2)}
                    </pre>
                  </TabsContent>

                  <TabsContent value="validation" className="mt-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        {selectedTest.governedResult === "pass" ? (
                          <CheckCircle2 className="w-5 h-5 text-primary" />
                        ) : (
                          <XCircle className="w-5 h-5 text-destructive" />
                        )}
                        <span className="text-sm font-medium text-foreground">
                          {selectedTest.governedResult === "pass" ? "Validation Passed" : "Validation Failed"}
                        </span>
                      </div>
                      {selectedTest.governedEvidence?.validation_summary && (
                        <div className="grid grid-cols-3 gap-3 text-xs">
                          <div className="bg-card rounded p-2 text-center border border-border">
                            <p className="text-muted-foreground">Total</p>
                            <p className="text-lg font-bold text-foreground">{selectedTest.governedEvidence.validation_summary.total_checks || 0}</p>
                          </div>
                          <div className="bg-primary/10 rounded p-2 text-center border border-primary/30">
                            <p className="text-primary">Passed</p>
                            <p className="text-lg font-bold text-foreground">{selectedTest.governedEvidence.validation_summary.passed_checks || 0}</p>
                          </div>
                          <div className="bg-destructive/10 rounded p-2 text-center border border-destructive/30">
                            <p className="text-destructive">Failed</p>
                            <p className="text-lg font-bold text-foreground">{selectedTest.governedEvidence.validation_summary.failed_checks || 0}</p>
                          </div>
                        </div>
                      )}
                      {selectedTest.governedEvidence?.validation_summary?.failures?.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-foreground">Failures:</p>
                          {selectedTest.governedEvidence.validation_summary.failures.map((f, i) => (
                            <p key={i} className="text-xs text-destructive bg-destructive/10 p-2 rounded border border-destructive/30">
                              {f}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}