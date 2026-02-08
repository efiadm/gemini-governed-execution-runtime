import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FlaskConical, CheckCircle2, XCircle, Clock, Loader2, Eye } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function TestSuiteTable({ results, isRunning, currentTestId, onViewEvidence }) {
  if (!results || results.length === 0) {
    return (
      <Card className="border-slate-200 shadow-sm rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <FlaskConical className="w-4 h-4" />
            Test Suite
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-400 italic">
            Click "Run Test Suite" to execute all 5 governance tests.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
          <FlaskConical className="w-4 h-4" />
          Test Suite Results
          {isRunning && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="text-[10px] uppercase tracking-wider font-bold w-20">ID</TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider font-bold">Test</TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider font-bold text-center">Baseline</TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider font-bold text-center">Governed</TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider font-bold text-center">Hybrid</TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider font-bold text-center">Attempts</TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider font-bold text-center">Repairs</TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider font-bold text-center">Latency</TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider font-bold text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((r) => {
                const isActive = currentTestId === r.id;
                return (
                  <TableRow
                    key={r.id}
                    className={isActive ? "bg-blue-50" : ""}
                  >
                    <TableCell className="font-mono text-xs font-bold text-slate-500">
                      {r.id}
                      {isActive && isRunning && (
                        <Loader2 className="w-3 h-3 animate-spin inline ml-1" />
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-slate-700 max-w-[200px]">
                      {r.name}
                    </TableCell>
                    <TableCell className="text-center">
                      {r.baselineResult !== undefined ? (
                        r.baselineResult === "text" ? (
                          <Badge variant="secondary" className="text-[10px]">Plain Text</Badge>
                        ) : r.baselineResult === "pass" ? (
                          <CheckCircle2 className="w-4 h-4 text-green-600 mx-auto" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500 mx-auto" />
                        )
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {r.governedResult !== undefined ? (
                        r.governedResult === "pass" ? (
                          <CheckCircle2 className="w-4 h-4 text-green-600 mx-auto" />
                        ) : r.governedResult === "safe_mode" ? (
                          <Badge className="bg-amber-100 text-amber-800 text-[10px]">Safe Mode</Badge>
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500 mx-auto" />
                        )
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {r.hybridResult !== undefined ? (
                        r.hybridResult === "pass" ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" />
                        ) : r.hybridResult === "safe_mode" ? (
                          <Badge className="bg-amber-100 text-amber-800 text-[10px]">Safe</Badge>
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500 mx-auto" />
                        )
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center text-xs text-slate-600 font-mono">
                      {r.attempts ?? "—"}
                    </TableCell>
                    <TableCell className="text-center text-xs text-slate-600 font-mono">
                      {r.repairs ?? "—"}
                    </TableCell>
                    <TableCell className="text-center">
                      {r.latency_ms !== undefined ? (
                        <div className="flex items-center justify-center gap-1 text-xs text-slate-500">
                          <Clock className="w-3 h-3" />
                          {r.latency_ms}ms
                        </div>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {r.governedResult && onViewEvidence && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onViewEvidence(r)}
                          className="h-7 text-xs"
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          View
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}