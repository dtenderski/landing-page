import { useState, useEffect, useRef } from "react";
import { Settings, X, Upload, Trash2, Plus, Loader2, CheckCircle2, RefreshCw, BookOpen, Sliders, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

const MODELS = [
  "gpt-4o-mini", "gpt-4o", "gpt-4-turbo", "gpt-3.5-turbo",
  "deepseek-chat", "deepseek-reasoner",
  "qwen-turbo", "qwen-plus", "qwen-max",
  "gemini-1.5-flash", "gemini-1.5-pro", "gemini-2.0-flash",
];

interface AgentInfo {
  id: number; name: string; slug: string; model: string;
  temperature: number; maxTokens: number; systemPrompt: string;
  isEnabled: boolean; agenticSubAgents: any; tagline: string;
}

interface KBEntry {
  id: number; name: string; type: string; processingStatus: string;
  knowledgeLayer: string; createdAt: string;
}

interface MultiClawConfigModalProps {
  agentSlug: string;
  agentName: string;
}

export default function MultiClawConfigModal({ agentSlug, agentName }: MultiClawConfigModalProps) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"kb" | "settings">("kb");
  const [agent, setAgent] = useState<AgentInfo | null>(null);
  const [kbList, setKbList] = useState<KBEntry[]>([]);
  const [loadingAgent, setLoadingAgent] = useState(false);
  const [loadingKB, setLoadingKB] = useState(false);
  const [addMode, setAddMode] = useState<"text" | "url" | null>(null);
  const [kbName, setKbName] = useState("");
  const [kbContent, setKbContent] = useState("");
  const [kbUrl, setKbUrl] = useState("");
  const [addingKB, setAddingKB] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [editPrompt, setEditPrompt] = useState("");
  const [editModel, setEditModel] = useState("gpt-4o-mini");
  const [editTemp, setEditTemp] = useState(0.7);
  const [editMaxTokens, setEditMaxTokens] = useState(2000);
  const [savingSettings, setSavingSettings] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const { toast } = useToast();

  async function loadAgent() {
    if (!agentSlug) return;
    setLoadingAgent(true);
    try {
      const r = await fetch(`/api/multiclaw/agent/${agentSlug}`);
      if (!r.ok) throw new Error("Agent not found");
      const a = await r.json();
      setAgent(a);
      setEditPrompt(a.systemPrompt || "");
      setEditModel(a.model || "gpt-4o-mini");
      setEditTemp(a.temperature ?? 0.7);
      setEditMaxTokens(a.maxTokens ?? 2000);
    } catch { toast({ title: "Gagal memuat agent", variant: "destructive" }); }
    finally { setLoadingAgent(false); }
  }

  async function loadKB(agentId: number) {
    setLoadingKB(true);
    try {
      const r = await fetch(`/api/knowledge-base/${agentId}`);
      if (r.ok) setKbList(await r.json());
    } catch { } finally { setLoadingKB(false); }
  }

  useEffect(() => {
    if (open && !agent) loadAgent();
  }, [open]);

  useEffect(() => {
    if (agent) loadKB(agent.id);
  }, [agent]);

  async function propagateKBToSubAgents(payload: { name: string; type: string; content: string; fileUrl?: string }) {
    const subAgents = Array.isArray(agent?.agenticSubAgents) ? agent!.agenticSubAgents : [];
    const subIds = subAgents.map((s: any) => Number(s.agentId)).filter((id: number) => !isNaN(id) && id > 0);
    if (subIds.length === 0) return 0;
    const results = await Promise.allSettled(
      subIds.map((id: number) =>
        fetch("/api/knowledge-base", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ agentId: id, name: payload.name, type: payload.type, content: payload.content, fileUrl: payload.fileUrl, knowledgeLayer: "operational" }),
        })
      )
    );
    return results.filter(r => r.status === "fulfilled" && (r.value as Response).ok).length;
  }

  async function addKBText() {
    if (!agent || !kbName.trim() || !kbContent.trim()) return;
    setAddingKB(true);
    try {
      const r = await fetch("/api/knowledge-base", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ agentId: agent.id, name: kbName, type: "text", content: kbContent, knowledgeLayer: "operational" }) });
      if (r.status === 401) throw new Error("Harap login terlebih dahulu");
      if (!r.ok) throw new Error("Gagal menyimpan");
      const subCount = Array.isArray(agent.agenticSubAgents) ? agent.agenticSubAgents.length : 0;
      if (subCount > 0) {
        const n = await propagateKBToSubAgents({ name: kbName, type: "text", content: kbContent });
        toast({ title: `KB tersimpan ✓ · disebarkan ke ${n}/${subCount} sub-agent` });
      } else {
        toast({ title: "KB berhasil ditambahkan ✓" });
      }
      setKbName(""); setKbContent(""); setAddMode(null); loadKB(agent.id);
    } catch (e: any) { toast({ title: `Gagal: ${e.message}`, variant: "destructive" }); }
    finally { setAddingKB(false); }
  }

  async function addKBUrl() {
    if (!agent || !kbName.trim() || !kbUrl.trim()) return;
    setAddingKB(true);
    try {
      const isYT = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/|youtube\.com\/embed\/)/.test(kbUrl);
      const urlType = isYT ? "youtube" : "url";
      const r = await fetch("/api/knowledge-base", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ agentId: agent.id, name: kbName, type: urlType, content: kbUrl, knowledgeLayer: "operational" }) });
      if (r.status === 401) throw new Error("Harap login terlebih dahulu");
      if (!r.ok) throw new Error("Gagal menyimpan URL");
      const subCount = Array.isArray(agent.agenticSubAgents) ? agent.agenticSubAgents.length : 0;
      if (subCount > 0) {
        const n = await propagateKBToSubAgents({ name: kbName, type: urlType, content: kbUrl });
        toast({ title: `${isYT ? "YouTube" : "URL"} KB tersimpan ✓ · disebarkan ke ${n}/${subCount} sub-agent` });
      } else {
        toast({ title: isYT ? "YouTube KB ditambahkan — mengekstrak transcript... ✓" : "URL KB berhasil ditambahkan ✓" });
      }
      setKbName(""); setKbUrl(""); setAddMode(null); loadKB(agent.id);
    } catch (e: any) { toast({ title: `Gagal: ${e.message}`, variant: "destructive" }); }
    finally { setAddingKB(false); }
  }

  async function uploadFile(file: File) {
    if (!agent) return;
    setUploadingFile(true);
    try {
      const fd = new FormData(); fd.append("file", file);
      const r1 = await fetch("/api/knowledge-base/upload", { method: "POST", body: fd });
      if (r1.status === 401) throw new Error("Harap login terlebih dahulu");
      if (!r1.ok) throw new Error("Upload gagal");
      const { fileUrl, fileName } = await r1.json();
      const name = fileName || file.name;
      const r2 = await fetch("/api/knowledge-base", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ agentId: agent.id, name, type: "file", content: "", fileUrl, knowledgeLayer: "operational" }) });
      if (!r2.ok) throw new Error("Gagal menyimpan metadata file");
      const subCount = Array.isArray(agent.agenticSubAgents) ? agent.agenticSubAgents.length : 0;
      if (subCount > 0) {
        const n = await propagateKBToSubAgents({ name, type: "file", content: "", fileUrl });
        toast({ title: `File diupload ✓ · disebarkan ke ${n}/${subCount} sub-agent` });
      } else {
        toast({ title: `File "${file.name}" berhasil diupload ✓` });
      }
      loadKB(agent.id);
    } catch (e: any) { toast({ title: `Gagal upload: ${e.message}`, variant: "destructive" }); }
    finally { setUploadingFile(false); }
  }

  async function deleteKB(id: number) {
    setDeletingId(id);
    try {
      const r = await fetch(`/api/knowledge-base/${id}`, { method: "DELETE" });
      if (r.ok) { toast({ title: "KB dihapus" }); setKbList(prev => prev.filter(k => k.id !== id)); }
      else throw new Error();
    } catch { toast({ title: "Gagal hapus KB", variant: "destructive" }); }
    finally { setDeletingId(null); }
  }

  async function saveSettings() {
    if (!agent) return;
    setSavingSettings(true);
    try {
      const r = await fetch(`/api/agents/${agent.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ systemPrompt: editPrompt, aiModel: editModel, temperature: editTemp, maxTokens: editMaxTokens }) });
      if (r.ok) { toast({ title: "Pengaturan tersimpan ✓" }); }
      else throw new Error();
    } catch { toast({ title: "Gagal simpan pengaturan", variant: "destructive" }); }
    finally { setSavingSettings(false); }
  }

  const TYPE_ICON: Record<string, string> = { text: "📄", url: "🌐", file: "📎", youtube: "▶️" };
  const STATUS_COLOR: Record<string, string> = { completed: "text-green-400", processing: "text-yellow-400", error: "text-red-400" };

  return (
    <>
      <button onClick={() => setOpen(true)} className="fixed bottom-6 right-6 z-50 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 rounded-full p-3 shadow-xl transition-all hover:scale-105 group" title="Konfigurasi KB & Pengaturan">
        <Settings className="h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative w-full max-w-md bg-slate-900 border-l border-slate-700 shadow-2xl flex flex-col h-full overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/60 shrink-0">
              <div>
                <div className="text-white font-semibold text-sm">{agentName}</div>
                {agent && <div className="text-slate-400 text-xs font-mono">{agent.slug}</div>}
              </div>
              <div className="flex items-center gap-2">
                <Link href={`/multiclaw-admin?slug=${agentSlug}`}>
                  <button className="text-slate-400 hover:text-blue-400 transition-colors" title="Buka di Admin Hub"><ExternalLink className="h-4 w-4" /></button>
                </Link>
                <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-white transition-colors"><X className="h-5 w-5" /></button>
              </div>
            </div>

            <div className="flex border-b border-slate-700/60 shrink-0">
              {[{ k: "kb", label: "Knowledge Base", icon: <BookOpen className="h-3.5 w-3.5" /> }, { k: "settings", label: "Pengaturan", icon: <Sliders className="h-3.5 w-3.5" /> }].map(t => (
                <button key={t.k} onClick={() => setTab(t.k as any)} className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors ${tab === t.k ? "text-blue-400 border-b-2 border-blue-400" : "text-slate-400 hover:text-slate-200"}`}>
                  {t.icon}{t.label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {loadingAgent && <div className="flex items-center justify-center h-32"><Loader2 className="h-6 w-6 text-slate-400 animate-spin" /></div>}

              {!loadingAgent && tab === "kb" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-slate-400">{kbList.length} sumber KB tersimpan</div>
                    <div className="flex gap-1">
                      <button onClick={() => agent && loadKB(agent.id)} className="text-slate-500 hover:text-slate-300 transition-colors"><RefreshCw className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>
                  {loadingKB ? <div className="text-center text-slate-500 text-xs py-4"><Loader2 className="h-4 w-4 animate-spin mx-auto" /></div> : kbList.length === 0 ? (
                    <div className="bg-slate-800/40 rounded-lg p-4 text-center text-slate-500 text-xs">Belum ada KB. Tambahkan teks, URL, atau upload file di bawah.</div>
                  ) : (
                    <div className="space-y-1.5">
                      {kbList.map(kb => (
                        <div key={kb.id} className="bg-slate-800/60 rounded-lg px-3 py-2 flex items-center gap-2">
                          <span className="text-base">{TYPE_ICON[kb.type] ?? "📄"}</span>
                          <div className="flex-1 min-w-0">
                            <div className="text-slate-200 text-xs font-medium truncate">{kb.name}</div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-slate-500 text-xs capitalize">{kb.type}</span>
                              <span className={`text-xs ${STATUS_COLOR[kb.processingStatus] ?? "text-slate-400"}`}>● {kb.processingStatus}</span>
                            </div>
                          </div>
                          <button onClick={() => deleteKB(kb.id)} disabled={deletingId === kb.id} className="text-slate-600 hover:text-red-400 transition-colors ml-1">
                            {deletingId === kb.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="border-t border-slate-700/50 pt-3">
                    {!addMode && (
                      <div className="grid grid-cols-3 gap-2">
                        <button onClick={() => setAddMode("text")} className="bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg p-2.5 text-center text-xs text-slate-300 transition-colors">📄<div className="mt-0.5">Teks</div></button>
                        <button onClick={() => setAddMode("url")} className="bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg p-2.5 text-center text-xs text-slate-300 transition-colors">🌐<div className="mt-0.5">URL / Web</div></button>
                        <button onClick={() => fileRef.current?.click()} disabled={uploadingFile} className="bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg p-2.5 text-center text-xs text-slate-300 transition-colors">
                          {uploadingFile ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "📎"}<div className="mt-0.5">Upload File</div>
                        </button>
                        <input ref={fileRef} type="file" className="hidden" accept=".pdf,.docx,.txt,.md,.xlsx,.csv" onChange={e => { if (e.target.files?.[0]) uploadFile(e.target.files[0]); }} />
                      </div>
                    )}

                    {addMode === "text" && (
                      <div className="space-y-2">
                        <input className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-xs text-white placeholder-slate-500" placeholder="Nama sumber KB" value={kbName} onChange={e => setKbName(e.target.value)} />
                        <textarea className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-xs text-white placeholder-slate-500 resize-none" rows={6} placeholder="Tempel teks konten di sini..." value={kbContent} onChange={e => setKbContent(e.target.value)} />
                        <div className="flex gap-2">
                          <Button onClick={addKBText} disabled={addingKB} size="sm" className="flex-1 bg-blue-600 hover:bg-blue-700 text-xs h-7">
                            {addingKB ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Plus className="h-3 w-3 mr-1" />}Simpan
                          </Button>
                          <Button onClick={() => { setAddMode(null); setKbName(""); setKbContent(""); }} variant="outline" size="sm" className="border-slate-600 text-slate-400 text-xs h-7">Batal</Button>
                        </div>
                      </div>
                    )}

                    {addMode === "url" && (
                      <div className="space-y-2">
                        <input className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-xs text-white placeholder-slate-500" placeholder="Nama sumber KB" value={kbName} onChange={e => setKbName(e.target.value)} />
                        <input className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-xs text-white placeholder-slate-500" placeholder="https://..." value={kbUrl} onChange={e => setKbUrl(e.target.value)} />
                        <div className="flex gap-2">
                          <Button onClick={addKBUrl} disabled={addingKB} size="sm" className="flex-1 bg-blue-600 hover:bg-blue-700 text-xs h-7">
                            {addingKB ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Plus className="h-3 w-3 mr-1" />}Simpan URL
                          </Button>
                          <Button onClick={() => { setAddMode(null); setKbName(""); setKbUrl(""); }} variant="outline" size="sm" className="border-slate-600 text-slate-400 text-xs h-7">Batal</Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {!loadingAgent && tab === "settings" && agent && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block font-medium">Model AI</label>
                    <select className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-2 text-sm text-white" value={editModel} onChange={e => setEditModel(e.target.value)}>
                      {MODELS.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block font-medium">Temperature</label>
                      <input type="number" step="0.1" min="0" max="2" className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-2 text-sm text-white" value={editTemp} onChange={e => setEditTemp(Number(e.target.value))} />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block font-medium">Max Tokens</label>
                      <input type="number" step="100" min="500" max="8000" className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-2 text-sm text-white" value={editMaxTokens} onChange={e => setEditMaxTokens(Number(e.target.value))} />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs text-slate-400 font-medium">System Prompt</label>
                      <span className="text-xs text-slate-500">{editPrompt.length} karakter</span>
                    </div>
                    <textarea className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-2 text-xs text-white font-mono resize-none" rows={14} value={editPrompt} onChange={e => setEditPrompt(e.target.value)} />
                  </div>
                  <Button onClick={saveSettings} disabled={savingSettings} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                    {savingSettings ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Menyimpan...</> : <><CheckCircle2 className="h-4 w-4 mr-2" />Simpan Pengaturan</>}
                  </Button>
                  {agent.agenticSubAgents && (
                    <div className="bg-slate-800/60 rounded-lg p-3">
                      <div className="text-xs text-slate-400 font-medium mb-1.5">Sub-Agents ({Array.isArray(agent.agenticSubAgents) ? agent.agenticSubAgents.length : "?"} agen)</div>
                      <div className="space-y-1">
                        {(Array.isArray(agent.agenticSubAgents) ? agent.agenticSubAgents : []).map((sa: any, i: number) => (
                          <div key={i} className="text-xs text-slate-400 flex gap-2">
                            <span className="text-slate-300 font-mono">[{sa.role}]</span>
                            <span>ID {sa.agentId}</span>
                            <span className="truncate text-slate-500">{sa.description}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
