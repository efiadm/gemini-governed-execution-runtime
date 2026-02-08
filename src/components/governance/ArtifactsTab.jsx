import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Download, Upload, Trash2, Edit2, Save, X, FileText } from "lucide-react";
import { toast } from "sonner";
import {
  listArtifacts,
  createArtifact,
  updateArtifact,
  deleteArtifact,
  exportArtifactPack,
  importArtifactPack,
} from "./localStore";

export default function ArtifactsTab() {
  const [artifacts, setArtifacts] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({ title: "", type: "fact", body: "", tags: [] });

  useEffect(() => {
    loadArtifacts();
  }, []);

  const loadArtifacts = async () => {
    try {
      const data = await listArtifacts();
      setArtifacts(data);
    } catch (err) {
      toast.error("Failed to load artifacts");
    }
  };

  const handleCreate = async () => {
    try {
      await createArtifact(formData);
      setFormData({ title: "", type: "fact", body: "", tags: [] });
      setIsCreating(false);
      loadArtifacts();
      toast.success("Artifact created");
    } catch (err) {
      toast.error("Failed to create artifact");
    }
  };

  const handleUpdate = async (id) => {
    try {
      await updateArtifact(id, formData);
      setEditingId(null);
      setFormData({ title: "", type: "fact", body: "", tags: [] });
      loadArtifacts();
      toast.success("Artifact updated");
    } catch (err) {
      toast.error("Failed to update artifact");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this artifact?")) return;
    try {
      await deleteArtifact(id);
      loadArtifacts();
      toast.success("Artifact deleted");
    } catch (err) {
      toast.error("Failed to delete artifact");
    }
  };

  const handleExport = async () => {
    try {
      const pack = await exportArtifactPack();
      const blob = new Blob([JSON.stringify(pack, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `artifacts-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Artifacts exported");
    } catch (err) {
      toast.error("Failed to export");
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const pack = JSON.parse(text);
      await importArtifactPack(pack);
      loadArtifacts();
      toast.success(`Imported ${pack.artifacts.length} artifacts`);
    } catch (err) {
      toast.error("Failed to import");
    }
  };

  const startEdit = (artifact) => {
    setEditingId(artifact.id);
    setFormData({
      title: artifact.title,
      type: artifact.type,
      body: typeof artifact.body === "string" ? artifact.body : JSON.stringify(artifact.body, null, 2),
      tags: artifact.tags || [],
    });
  };

  const totalSize = artifacts.reduce((sum, a) => sum + (a.size_bytes || 0), 0);

  return (
    <div className="space-y-4">
      <Card className="border-slate-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold text-slate-700">Local Artifacts</CardTitle>
              <p className="text-xs text-slate-500 mt-1">
                {artifacts.length} artifacts • {(totalSize / 1024).toFixed(1)} KB
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="w-3 h-3 mr-1" />
                Export
              </Button>
              <label>
                <Button variant="outline" size="sm" asChild>
                  <span>
                    <Upload className="w-3 h-3 mr-1" />
                    Import
                  </span>
                </Button>
                <input type="file" accept=".json" onChange={handleImport} className="hidden" />
              </label>
              <Button size="sm" onClick={() => setIsCreating(true)}>
                <Plus className="w-3 h-3 mr-1" />
                New
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {(isCreating || editingId) && (
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
              <Input
                placeholder="Title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
              <select
                className="w-full px-3 py-2 rounded-md border border-slate-200 text-sm"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              >
                <option value="fact">Fact</option>
                <option value="rule">Rule</option>
                <option value="context">Context</option>
                <option value="memory">Memory</option>
              </select>
              <Textarea
                placeholder="Body (text or JSON)"
                value={formData.body}
                onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                className="h-32"
              />
              <Input
                placeholder="Tags (comma-separated)"
                value={formData.tags.join(", ")}
                onChange={(e) =>
                  setFormData({ ...formData, tags: e.target.value.split(",").map((t) => t.trim()) })
                }
              />
              <div className="flex gap-2">
                {editingId ? (
                  <Button size="sm" onClick={() => handleUpdate(editingId)}>
                    <Save className="w-3 h-3 mr-1" />
                    Save
                  </Button>
                ) : (
                  <Button size="sm" onClick={handleCreate}>
                    <Plus className="w-3 h-3 mr-1" />
                    Create
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsCreating(false);
                    setEditingId(null);
                    setFormData({ title: "", type: "fact", body: "", tags: [] });
                  }}
                >
                  <X className="w-3 h-3 mr-1" />
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {artifacts.length === 0 && !isCreating && (
            <p className="text-sm text-slate-400 italic text-center py-8">
              No artifacts yet. Create one to start building local context.
            </p>
          )}

          {artifacts.map((artifact) => (
            <div
              key={artifact.id}
              className="bg-white p-3 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="w-3 h-3 text-slate-400" />
                    <span className="text-sm font-medium text-slate-800">{artifact.title}</span>
                    <Badge variant="secondary" className="text-[10px]">
                      {artifact.type}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2">
                    {typeof artifact.body === "string"
                      ? artifact.body.substring(0, 100)
                      : JSON.stringify(artifact.body).substring(0, 100)}
                  </p>
                  {artifact.tags && artifact.tags.length > 0 && (
                    <div className="flex gap-1 mt-2">
                      {artifact.tags.map((tag, i) => (
                        <Badge key={i} variant="outline" className="text-[9px]">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-1 ml-2">
                  <Button variant="ghost" size="sm" onClick={() => startEdit(artifact)} className="h-7 w-7 p-0">
                    <Edit2 className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(artifact.id)}
                    className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}