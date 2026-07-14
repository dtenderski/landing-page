import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Bot, Loader2, ArrowLeft, MessageCircle, ChevronRight, Lock, CreditCard, Download, Smartphone, Mic, MicOff, Volume2, VolumeX, Paperclip, X, FileText, Image as ImageIcon, Music, Video, File, Share2, Copy, Check, FileDown, FileCode2, Trash2, Link2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useParams } from "wouter";
import { cn } from "@/lib/utils";
import { MessageContent } from "@/lib/format-message";
import { parseBrainUpdates, BrainChip } from "@/lib/brain-utils";

interface UploadedFile {
  fileName: string;
  fileSize: number;
  fileType: string;
  fileUrl: string;
  category: string;
  mimeType: string;
}

interface ChatbotInfo {
  agentId: string;
  name: string;
  avatar: string;
  description: string;
  tagline: string;
  greetingMessage: string;
  conversationStarters: string[];
  color: string;
  category: string;
  subcategory: string;
  toolboxName: string;
  toolboxId: string;
  slug: string;
}

interface ModulData {
  id: string;
  name: string;
  description: string;
  purpose: string;
  seriesName: string;
  chatbots: ChatbotInfo[];
  pricing?: {
    monthlyPrice: number;
    trialEnabled: boolean;
    trialDays: number;
    requireRegistration: boolean;
  };
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function ModulChat() {
  const params = useParams<{ bigIdeaId: string }>();
  const [modul, setModul] = useState<ModulData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBot, setSelectedBot] = useState<ChatbotInfo | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const sessionIdRef = useRef<string>(`modul_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`);

  const [hasAccess, setHasAccess] = useState(true);
  const [accessChecked, setAccessChecked] = useState(false);
  const [showUpgradeWall, setShowUpgradeWall] = useState(false);
  const [subName, setSubName] = useState("");
  const [subEmail, setSubEmail] = useState("");
  const [subPhone, setSubPhone] = useState("");
  const [subscribing, setSubscribing] = useState(false);
  // Email-based access gate (shown when no active access but modul is paid)
  const [showEmailGate, setShowEmailGate] = useState(false);
  const [emailGateInput, setEmailGateInput] = useState("");
  const [emailGateChecking, setEmailGateChecking] = useState(false);
  const [emailGateError, setEmailGateError] = useState("");
  const [subscribedEmail, setSubscribedEmail] = useState<string | null>(null);
  const [pwaPrompt, setPwaPrompt] = useState<any>(null);
  const [pwaInstalled, setPwaInstalled] = useState(false);

  // File upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingFiles, setPendingFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Voice STT
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  // TTS voice mode
  const [voiceMode, setVoiceMode] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // File upload helpers
  const getFileIcon = (category: string) => {
    switch (category) {
      case "image": return <ImageIcon className="w-4 h-4" />;
      case "audio": return <Music className="w-4 h-4" />;
      case "video": return <Video className="w-4 h-4" />;
      case "document": return <FileText className="w-4 h-4" />;
      default: return <File className="w-4 h-4" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsUploading(true);
    const uploaded: UploadedFile[] = [];
    for (const file of Array.from(files)) {
      try {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/chat/upload", { method: "POST", body: formData });
        if (res.ok) {
          const data = await res.json();
          uploaded.push(data);
        }
      } catch (err) {
        console.error("Upload failed:", err);
      }
    }
    setPendingFiles(prev => [...prev, ...uploaded]);
    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removePendingFile = (idx: number) => {
    setPendingFiles(prev => prev.filter((_, i) => i !== idx));
  };

  // TTS speak
  const speakText = async (text: string) => {
    const cleanText = text
      .replace(/#{1,6}\s*/g, "")
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .replace(/\*([^*]+)\*/g, "$1")
      .replace(/__([^_]+)__/g, "$1")
      .replace(/_([^_]+)_/g, "$1")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/^[-*+]\s+/gm, "")
      .replace(/^\d+\.\s+/gm, "")
      .replace(/^>\s*/gm, "")
      .replace(/---+/g, "")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .trim();
    if (!cleanText) return;
    try {
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: cleanText }),
      });
      if (!response.ok) return;
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      setIsSpeaking(true);
      audio.onended = () => { setIsSpeaking(false); audioRef.current = null; URL.revokeObjectURL(audioUrl); };
      audio.onerror = () => { setIsSpeaking(false); audioRef.current = null; URL.revokeObjectURL(audioUrl); };
      await audio.play();
    } catch { setIsSpeaking(false); }
  };

  const stopSpeaking = () => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    setIsSpeaking(false);
  };

  // Chat save / share
  const [chatCopied, setChatCopied] = useState(false);

  const buildChatText = (format: "txt" | "md" = "txt") => {
    const botName = selectedBot?.name || "AI";
    const header = format === "md"
      ? `# Chat dengan ${botName}\n*${new Date().toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}*\n\n---\n\n`
      : `Chat dengan ${botName}\n${"=".repeat(40)}\n${new Date().toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}\n\n`;
    const lines = messages.map(m => {
      const time = m.timestamp.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
      const sender = m.role === "user" ? "Anda" : botName;
      if (format === "md") return `### ${m.role === "user" ? "👤" : "🤖"} ${sender} — ${time}\n\n${m.content}\n`;
      return `[${time}] ${sender}:\n${m.content}\n`;
    });
    return header + lines.join("\n---\n\n");
  };

  const exportChat = () => {
    if (messages.length === 0) return;
    const blob = new Blob([buildChatText("txt")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chat-${selectedBot?.name || "ai"}-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportChatMarkdown = () => {
    if (messages.length === 0) return;
    const blob = new Blob([buildChatText("md")], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chat-${selectedBot?.name || "ai"}-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyFullChat = async () => {
    if (messages.length === 0) return;
    await navigator.clipboard.writeText(buildChatText("txt"));
    setChatCopied(true);
    setTimeout(() => setChatCopied(false), 2500);
  };

  const clearChat = () => {
    setMessages([]);
    if (selectedBot) {
      sessionIdRef.current = `modul_${selectedBot.agentId}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: selectedBot?.name || modul?.name || "Chat", url: window.location.href }); } catch {}
    } else {
      await navigator.clipboard.writeText(window.location.href);
    }
  };

  // Speech recognition init
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    setSpeechSupported(true);
    const recognition = new SpeechRecognition();
    recognition.lang = "id-ID";
    recognition.continuous = false;
    recognition.interimResults = false;
    let finalTranscript = "";
    recognition.onstart = () => { finalTranscript = ""; setIsListening(true); };
    recognition.onresult = (e: any) => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) finalTranscript += e.results[i][0].transcript;
      }
    };
    recognition.onend = () => {
      setIsListening(false);
      if (finalTranscript.trim()) setInput(finalTranscript.trim());
    };
    recognition.onerror = () => setIsListening(false);
    recognitionRef.current = recognition;
  }, []);

  const toggleSpeech = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setInput("");
      recognitionRef.current.start();
    }
  };

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setPwaPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler as any);
    window.addEventListener("appinstalled", () => { setPwaInstalled(true); setPwaPrompt(null); });
    if ((window as any).__pwaInstallPrompt) setPwaPrompt((window as any).__pwaInstallPrompt);
    if ((window as any).__pwaInstalled) setPwaInstalled(true);
    return () => window.removeEventListener("beforeinstallprompt", handler as any);
  }, []);

  const handleInstallPwa = useCallback(async () => {
    if (!pwaPrompt) return;
    pwaPrompt.prompt();
    const result = await pwaPrompt.userChoice;
    if (result.outcome === "accepted") { setPwaInstalled(true); setPwaPrompt(null); }
  }, [pwaPrompt]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("subscribed") === "true") {
      setHasAccess(true);
      setAccessChecked(true);
    }
  }, []);

  useEffect(() => {
    fetch(`/api/public/modul/${params.bigIdeaId}`)
      .then(r => {
        if (!r.ok) throw new Error("Modul tidak ditemukan");
        return r.json();
      })
      .then((data: ModulData) => {
        setModul(data);
        setLoading(false);

        document.title = `${data.name} - Gustafta AI`;
        const manifestLink = document.querySelector('link[rel="manifest"]');
        if (manifestLink) manifestLink.setAttribute("href", `/api/manifest/modul/${data.id}`);

        const urlParams = new URLSearchParams(window.location.search);
        const justSubscribed = urlParams.get("subscribed") === "true";
        if (justSubscribed) {
          setHasAccess(true);
          setAccessChecked(true);
          return;
        }
        if (data.pricing && data.pricing.monthlyPrice > 0) {
          // Email-based check: try URL param first, then sessionStorage, then localStorage (legacy)
          const urlParams2 = new URLSearchParams(window.location.search);
          const emailFromUrl = urlParams2.get("email");
          const savedEmail = emailFromUrl ||
            sessionStorage.getItem(`modul_email_${params.bigIdeaId}`) ||
            localStorage.getItem(`modul_email_${params.bigIdeaId}`);
          const savedToken = localStorage.getItem(`modul_access_${params.bigIdeaId}`) ||
            localStorage.getItem(`modul_token_${params.bigIdeaId}`);

          if (savedEmail) {
            if (emailFromUrl) setEmailGateInput(emailFromUrl);
            fetch(`/api/modul/${params.bigIdeaId}/access?email=${encodeURIComponent(savedEmail)}${savedToken ? `&token=${encodeURIComponent(savedToken)}` : ""}`)
              .then(r => r.json())
              .then(result => {
                if (result.hasAccess) {
                  setSubscribedEmail(savedEmail);
                  sessionStorage.setItem(`modul_email_${params.bigIdeaId}`, savedEmail);
                }
                setHasAccess(result.hasAccess);
                setAccessChecked(true);
              })
              .catch(() => {
                setHasAccess(false);
                setAccessChecked(true);
              });
          } else {
            // No saved email — show email gate instead of access wall
            setHasAccess(false);
            setAccessChecked(true);
            setShowEmailGate(true);
          }
        } else {
          setAccessChecked(true);
        }
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [params.bigIdeaId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const selectBot = useCallback((bot: ChatbotInfo) => {
    setSelectedBot(bot);
    setMessages([{
      id: "greeting",
      role: "assistant",
      content: bot.greetingMessage || "Halo! Ada yang bisa saya bantu?",
      timestamp: new Date(),
    }]);
    sessionIdRef.current = `modul_${bot.agentId}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }, []);

  const goBack = useCallback(() => {
    setSelectedBot(null);
    setMessages([]);
    setInput("");
  }, []);

  const sendMessage = useCallback(async () => {
    if ((!input.trim() && pendingFiles.length === 0) || !selectedBot || isStreaming) return;

    const attachments = [...pendingFiles];
    setPendingFiles([]);

    const displayContent = input.trim() || attachments.map(f => `[${f.fileName}]`).join(", ");
    const userMsg: Message = {
      id: `user_${Date.now()}`,
      role: "user",
      content: displayContent,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    const messageContent = input.trim();
    setInput("");
    setIsStreaming(true);

    const assistantId = `assistant_${Date.now()}`;
    setMessages(prev => [...prev, {
      id: assistantId,
      role: "assistant",
      content: "",
      timestamp: new Date(),
    }]);

    try {
      // Retrieve stored access token for this modul (sent by server via client subscription)
      const storedToken = localStorage.getItem(`modul_access_${params.bigIdeaId}`) ||
                          localStorage.getItem(`modul_token_${params.bigIdeaId}`);

      const streamHeaders: Record<string, string> = { "Content-Type": "application/json" };
      if (storedToken) streamHeaders["x-client-token"] = storedToken;

      const res = await fetch("/api/messages/stream", {
        method: "POST",
        headers: streamHeaders,
        body: JSON.stringify({
          agentId: String(selectedBot.agentId),
          content: messageContent || attachments.map(f => `[${f.fileName}]`).join(", "),
          role: "user",
          sessionId: sessionIdRef.current,
          clientToken: storedToken || undefined,
          attachments: attachments.length > 0 ? attachments.map(f => ({
            fileName: f.fileName,
            fileUrl: f.fileUrl,
            category: f.category,
            fileSize: f.fileSize,
            mimeType: f.mimeType,
          })) : undefined,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        const reason = errData.reason;
        if (reason === "registration_required" || reason === "no_active_subscription") {
          setShowUpgradeWall(true);
          setMessages(prev => prev.filter(m => m.id !== assistantId));
          setIsStreaming(false);
          return;
        }
        if (reason === "guest_limit_reached") {
          setMessages(prev => prev.map(m => m.id === assistantId
            ? { ...m, content: "Batas pesan gratis tercapai. Silakan daftar untuk melanjutkan." }
            : m
          ));
          setIsStreaming(false);
          return;
        }
        throw new Error(errData.error || "Failed to send message");
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        let accumulated = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") continue;
              try {
                const parsed = JSON.parse(data);
                if (parsed.content) {
                  accumulated += parsed.content;
                  const cleaned = accumulated
                    .replace(/\[SAVE_MEMORY\][\s\S]*?\[\/SAVE_MEMORY\]/g, "")
                    .replace(/\[DELETE_MEMORY\][\s\S]*?\[\/DELETE_MEMORY\]/g, "");
                  setMessages(prev => prev.map(m =>
                    m.id === assistantId ? { ...m, content: cleaned } : m
                  ));
                }
              } catch {}
            }
          }
        }
        if (voiceMode && accumulated.trim()) {
          speakText(accumulated.trim());
        }
      }
    } catch (err) {
      setMessages(prev => prev.map(m =>
        m.id === assistantId ? { ...m, content: "Maaf, terjadi kesalahan. Silakan coba lagi." } : m
      ));
    } finally {
      setIsStreaming(false);
    }
  }, [input, selectedBot, isStreaming, pendingFiles, voiceMode]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }, [sendMessage]);

  const handleEmailGateCheck = useCallback(async () => {
    const email = emailGateInput.trim();
    if (!email) return;
    setEmailGateChecking(true);
    setEmailGateError("");
    try {
      const res = await fetch(`/api/modul/${params.bigIdeaId}/access?email=${encodeURIComponent(email)}`);
      const result = await res.json();
      if (result.hasAccess) {
        setSubscribedEmail(email);
        sessionStorage.setItem(`modul_email_${params.bigIdeaId}`, email);
        setHasAccess(true);
        setShowEmailGate(false);
      } else {
        setEmailGateError("Email tidak ditemukan atau berlangganan belum aktif. Pastikan email yang Anda gunakan saat mendaftar sudah benar.");
      }
    } catch {
      setEmailGateError("Gagal memeriksa akses. Coba lagi.");
    } finally {
      setEmailGateChecking(false);
    }
  }, [emailGateInput, params.bigIdeaId]);

  const handleSubscribe = useCallback(async (plan: string) => {
    if (!subName.trim() || !subEmail.trim()) return;
    setSubscribing(true);
    try {
      const res = await fetch(`/api/modul/${params.bigIdeaId}/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: subName.trim(),
          customerEmail: subEmail.trim(),
          customerPhone: subPhone.trim(),
          plan,
        }),
      });
      const data = await res.json();
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
        return;
      }
      if (data.subscription) {
        // Save email to sessionStorage (not just localStorage) for cross-session persistence
        sessionStorage.setItem(`modul_email_${params.bigIdeaId}`, subEmail.trim());
        localStorage.setItem(`modul_email_${params.bigIdeaId}`, subEmail.trim());
        if (data.subscription.accessToken || data.accessToken) {
          localStorage.setItem(`modul_access_${params.bigIdeaId}`, data.subscription.accessToken || data.accessToken || "");
        }
        setSubscribedEmail(subEmail.trim());
        setHasAccess(data.subscription.status === "active");
        setShowUpgradeWall(false);
      }
    } catch (err) {
      console.error("Subscribe error:", err);
    } finally {
      setSubscribing(false);
    }
  }, [subName, subEmail, subPhone, params.bigIdeaId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Memuat Modul...</p>
        </div>
      </div>
    );
  }

  if (error || !modul) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card>
          <CardContent className="p-8 text-center">
            <Bot className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">Modul Tidak Ditemukan</h2>
            <p className="text-muted-foreground">{error || "Halaman yang Anda cari tidak tersedia."}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!selectedBot) {
    return (
      <div className="min-h-screen bg-background" data-testid="modul-chat-page">
        {/* Sticky top bar with install button */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
          <div className="max-w-4xl mx-auto px-4 py-2 flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground truncate">
              {modul.seriesName || "Gustafta"}
            </span>
            {!pwaInstalled && pwaPrompt ? (
              <Button
                size="sm"
                variant="outline"
                onClick={handleInstallPwa}
                className="gap-1.5 text-xs shrink-0"
                data-testid="button-install-pwa"
              >
                <Download className="w-3.5 h-3.5" />
                Pasang di HP
              </Button>
            ) : pwaInstalled ? (
              <span className="text-xs text-green-600 flex items-center gap-1">
                <Smartphone className="w-3.5 h-3.5" /> Terpasang
              </span>
            ) : null}
          </div>
        </div>

        <div className="max-w-4xl mx-auto p-4 sm:p-6">
          <div className="text-center mb-8">
            {modul.seriesName && (
              <Badge variant="secondary" className="mb-3" data-testid="badge-series-name">
                {modul.seriesName}
              </Badge>
            )}
            <h1 className="text-2xl sm:text-3xl font-bold mb-2" data-testid="text-modul-name">
              {modul.name}
            </h1>
            {modul.description && (
              <p className="text-muted-foreground max-w-2xl mx-auto" data-testid="text-modul-description">
                {modul.description}
              </p>
            )}
            {modul.purpose && (
              <p className="text-sm text-muted-foreground mt-2">
                {modul.purpose}
              </p>
            )}
          </div>

          {accessChecked && !hasAccess && modul.pricing && modul.pricing.monthlyPrice > 0 ? (
            <Card data-testid="modul-upgrade-wall">
              <CardContent className="p-6 sm:p-8">
                {/* EMAIL GATE — returning subscriber */}
                {showEmailGate && !showUpgradeWall ? (
                  <div className="max-w-sm mx-auto space-y-4">
                    <div className="text-center">
                      <Lock className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                      <h3 className="text-base font-semibold mb-1">Sudah berlangganan?</h3>
                      <p className="text-muted-foreground text-sm">
                        Masukkan email yang Anda gunakan saat mendaftar.
                      </p>
                    </div>
                    <Input
                      placeholder="Email Anda"
                      type="email"
                      value={emailGateInput}
                      onChange={(e) => setEmailGateInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleEmailGateCheck()}
                      data-testid="input-email-gate"
                    />
                    {emailGateError && (
                      <p className="text-xs text-destructive">{emailGateError}</p>
                    )}
                    <Button
                      onClick={handleEmailGateCheck}
                      disabled={emailGateChecking || !emailGateInput.trim()}
                      className="w-full"
                      data-testid="button-email-gate-check"
                    >
                      {emailGateChecking ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      Masuk ke Modul
                    </Button>
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground">atau</span>
                      </div>
                    </div>
                    <Button variant="outline" onClick={() => { setShowEmailGate(false); setShowUpgradeWall(true); }} className="w-full" data-testid="button-new-subscribe">
                      Daftar Berlangganan
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="text-center mb-6">
                      <Lock className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                      <h3 className="text-lg font-semibold mb-2">Akses Premium</h3>
                      <p className="text-muted-foreground text-sm">
                        Langganan bundle untuk mengakses semua {modul.chatbots.length} chatbot dalam Modul ini.
                      </p>
                    </div>
                    <div className="text-center mb-6">
                      <p className="text-3xl font-bold">
                        Rp {modul.pricing.monthlyPrice.toLocaleString("id-ID")}
                      </p>
                      <p className="text-sm text-muted-foreground">per bulan</p>
                    </div>
                    {!showUpgradeWall ? (
                      <div className="flex flex-col items-center gap-3">
                        {modul.pricing.trialEnabled && (
                          <Button onClick={() => setShowUpgradeWall(true)} className="w-full max-w-xs" data-testid="button-start-trial">
                            Coba Gratis {modul.pricing.trialDays} Hari
                          </Button>
                        )}
                        <Button variant="outline" onClick={() => setShowUpgradeWall(true)} className="w-full max-w-xs" data-testid="button-subscribe">
                          <CreditCard className="w-4 h-4 mr-2" />
                          Langganan Sekarang
                        </Button>
                        <button
                          className="text-xs text-muted-foreground underline underline-offset-2 mt-1"
                          onClick={() => setShowEmailGate(true)}
                          data-testid="button-already-subscribed"
                        >
                          Sudah punya akses? Masuk di sini
                        </button>
                      </div>
                    ) : (
                      <div className="max-w-sm mx-auto space-y-3">
                        <Input
                          placeholder="Nama Lengkap"
                          value={subName}
                          onChange={(e) => setSubName(e.target.value)}
                          data-testid="input-sub-name"
                        />
                        <Input
                          placeholder="Email"
                          type="email"
                          value={subEmail}
                          onChange={(e) => setSubEmail(e.target.value)}
                          data-testid="input-sub-email"
                        />
                        <Input
                          placeholder="No. WhatsApp (opsional)"
                          value={subPhone}
                          onChange={(e) => setSubPhone(e.target.value)}
                          data-testid="input-sub-phone"
                        />
                        <div className="flex flex-col gap-2">
                          {modul.pricing.trialEnabled && (
                            <Button
                              onClick={() => handleSubscribe("trial")}
                              disabled={subscribing || !subName.trim() || !subEmail.trim()}
                              className="w-full"
                              data-testid="button-confirm-trial"
                            >
                              {subscribing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                              Mulai Trial {modul.pricing.trialDays} Hari
                            </Button>
                          )}
                          {modul.pricing.monthlyPrice > 0 && (
                            <Button
                              variant="outline"
                              onClick={() => handleSubscribe("monthly")}
                              disabled={subscribing || !subName.trim() || !subEmail.trim()}
                              className="w-full"
                              data-testid="button-confirm-monthly"
                            >
                              Bayar Rp {modul.pricing.monthlyPrice.toLocaleString("id-ID")}/bulan
                            </Button>
                          )}
                        </div>
                        <Button variant="ghost" onClick={() => setShowUpgradeWall(false)} className="w-full" size="sm">
                          Kembali
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          ) : (
            <>
              {modul.chatbots.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Bot className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-medium mb-1">Belum Ada Chatbot</h3>
                    <p className="text-muted-foreground text-sm">Modul ini belum memiliki chatbot aktif.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {modul.chatbots.map((bot) => (
                    <Card
                      key={bot.agentId}
                      className="cursor-pointer hover-elevate transition-all"
                      onClick={() => selectBot(bot)}
                      data-testid={`card-chatbot-${bot.agentId}`}
                    >
                      <CardContent className="p-5">
                        <div className="flex items-start gap-4">
                          <Avatar className="w-12 h-12 shrink-0">
                            <AvatarImage src={bot.avatar} alt={bot.name} />
                            <AvatarFallback style={{ backgroundColor: bot.color }}>
                              <Bot className="w-6 h-6 text-white" />
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-semibold truncate" data-testid={`text-bot-name-${bot.agentId}`}>
                                {bot.name}
                              </h3>
                              {bot.category && (
                                <Badge variant="secondary" className="text-xs">
                                  {bot.category}
                                </Badge>
                              )}
                            </div>
                            {bot.tagline && (
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                {bot.tagline}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                              <MessageCircle className="w-3.5 h-3.5" />
                              <span>{bot.toolboxName}</span>
                            </div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0 mt-1" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}

          <div className="text-center mt-8 text-xs text-muted-foreground">
            Powered by Gustafta
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background" data-testid="modul-chat-conversation">
      <header className="flex items-center gap-3 p-3 border-b shrink-0">
        <Button variant="ghost" size="icon" onClick={goBack} data-testid="button-back-to-list">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <Avatar className="w-9 h-9">
          <AvatarImage src={selectedBot.avatar} alt={selectedBot.name} />
          <AvatarFallback style={{ backgroundColor: selectedBot.color }}>
            <Bot className="w-4 h-4 text-white" />
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold text-sm truncate" data-testid="text-active-bot-name">{selectedBot.name}</h2>
          <p className="text-xs text-muted-foreground truncate">{selectedBot.tagline || selectedBot.toolboxName}</p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {!pwaInstalled && pwaPrompt ? (
            <Button
              size="sm"
              variant="outline"
              onClick={handleInstallPwa}
              className="gap-1 text-xs shrink-0 px-2"
              data-testid="button-install-pwa-chat"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Pasang</span>
            </Button>
          ) : null}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost" className="shrink-0" data-testid="button-share-menu">
                <Share2 className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="text-[11px] text-muted-foreground font-normal">Bagikan</DropdownMenuLabel>
              <DropdownMenuItem onClick={handleShare}>
                <Link2 className="w-3.5 h-3.5 mr-2" />
                Bagikan Link
              </DropdownMenuItem>
              {messages.length > 1 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="text-[11px] text-muted-foreground font-normal">Simpan Percakapan</DropdownMenuLabel>
                  <DropdownMenuItem onClick={copyFullChat} data-testid="button-copy-chat">
                    {chatCopied
                      ? <><Check className="w-3.5 h-3.5 mr-2 text-green-500" /><span className="text-green-600 font-medium">Tersalin!</span></>
                      : <><Copy className="w-3.5 h-3.5 mr-2" />Salin Percakapan</>
                    }
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={exportChat} data-testid="button-export-txt">
                    <FileDown className="w-3.5 h-3.5 mr-2" />
                    Unduh sebagai .TXT
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={exportChatMarkdown} data-testid="button-export-md">
                    <FileCode2 className="w-3.5 h-3.5 mr-2" />
                    Unduh sebagai .MD
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={clearChat} className="text-destructive focus:text-destructive" data-testid="button-clear-chat">
                    <Trash2 className="w-3.5 h-3.5 mr-2" />
                    Hapus Percakapan
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => {
          const isUser = msg.role === "user";
          const { fields: brainFields, cleanContent } = !isUser
            ? parseBrainUpdates(msg.content)
            : { fields: [], cleanContent: msg.content };
          return (
            <div
              key={msg.id}
              className={cn(
                "flex gap-3 max-w-[85%]",
                isUser ? "ml-auto flex-row-reverse" : ""
              )}
              data-testid={`message-${msg.id}`}
            >
              {!isUser && (
                <Avatar className="w-8 h-8 shrink-0">
                  <AvatarImage src={selectedBot.avatar} alt={selectedBot.name} />
                  <AvatarFallback style={{ backgroundColor: selectedBot.color }}>
                    <Bot className="w-4 h-4 text-white" />
                  </AvatarFallback>
                </Avatar>
              )}
              <div className="flex flex-col gap-1 min-w-0">
                <div
                  className={cn(
                    "rounded-lg px-4 py-2.5 text-sm break-words",
                    isUser
                      ? "bg-primary text-primary-foreground whitespace-pre-wrap"
                      : "bg-muted"
                  )}
                >
                  {isUser ? (
                    msg.content
                  ) : cleanContent ? (
                    <MessageContent text={cleanContent} />
                  ) : isStreaming ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : null}
                </div>
                {!isUser && <BrainChip fields={brainFields} />}
              </div>
            </div>
          );
        })}

        {selectedBot.conversationStarters && selectedBot.conversationStarters.length > 0 && messages.length <= 1 && (
          <div className="flex flex-wrap gap-2 justify-center mt-4">
            {selectedBot.conversationStarters.map((starter, i) => (
              <Button
                key={i}
                variant="outline"
                size="sm"
                onClick={() => {
                  if (!selectedBot || isStreaming) return;
                  const userMsg: Message = {
                    id: `user_${Date.now()}`,
                    role: "user",
                    content: starter,
                    timestamp: new Date(),
                  };
                  setMessages(prev => [...prev, userMsg]);
                  setInput("");

                  const assistantId = `assistant_${Date.now()}`;
                  setMessages(prev => [...prev, {
                    id: assistantId,
                    role: "assistant",
                    content: "",
                    timestamp: new Date(),
                  }]);
                  setIsStreaming(true);

                  fetch("/api/messages/stream", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      agentId: String(selectedBot.agentId),
                      content: starter,
                      role: "user",
                      sessionId: sessionIdRef.current,
                    }),
                  }).then(async (res) => {
                    if (!res.ok) throw new Error("Failed");
                    const reader = res.body?.getReader();
                    const decoder = new TextDecoder();
                    if (reader) {
                      let accumulated = "";
                      while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;
                        const chunk = decoder.decode(value, { stream: true });
                        const lines = chunk.split("\n");
                        for (const line of lines) {
                          if (line.startsWith("data: ")) {
                            const data = line.slice(6);
                            if (data === "[DONE]") continue;
                            try {
                              const parsed = JSON.parse(data);
                              if (parsed.content) {
                                accumulated += parsed.content;
                                const cleaned = accumulated
                                  .replace(/\[SAVE_MEMORY\][\s\S]*?\[\/SAVE_MEMORY\]/g, "")
                                  .replace(/\[DELETE_MEMORY\][\s\S]*?\[\/DELETE_MEMORY\]/g, "");
                                setMessages(prev => prev.map(m =>
                                  m.id === assistantId ? { ...m, content: cleaned } : m
                                ));
                              }
                            } catch {}
                          }
                        }
                      }
                    }
                  }).catch(() => {
                    setMessages(prev => prev.map(m =>
                      m.id === assistantId ? { ...m, content: "Maaf, terjadi kesalahan. Silakan coba lagi." } : m
                    ));
                  }).finally(() => {
                    setIsStreaming(false);
                  });
                }}
                data-testid={`button-starter-${i}`}
              >
                {starter}
              </Button>
            ))}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t p-3 shrink-0">
        {/* Pending files preview */}
        {pendingFiles.length > 0 && (
          <div className="flex flex-wrap gap-2 max-w-3xl mx-auto mb-2">
            {pendingFiles.map((file, idx) => (
              <div key={idx} className="flex items-center gap-1.5 bg-muted rounded-lg px-2.5 py-1.5 text-xs">
                {file.category === "image" ? (
                  <img src={file.fileUrl} alt={file.fileName} className="w-8 h-8 rounded object-cover" />
                ) : getFileIcon(file.category)}
                <span className="truncate max-w-[120px]">{file.fileName}</span>
                <span className="text-muted-foreground">{formatFileSize(file.fileSize)}</span>
                <button onClick={() => removePendingFile(idx)} className="ml-0.5 text-muted-foreground/60 hover:text-foreground rounded-full" data-testid={`button-remove-file-${idx}`}>
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
        {isUploading && (
          <div className="flex items-center gap-2 max-w-3xl mx-auto mb-2">
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Mengunggah file...</span>
          </div>
        )}

        <div className="flex items-end gap-2 max-w-3xl mx-auto">
          {/* File upload button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={isStreaming || isUploading}
            className="shrink-0 text-muted-foreground hover:text-foreground"
            title="Upload file / dokumen"
            data-testid="button-upload-file"
          >
            <Paperclip className="w-5 h-5" />
          </Button>

          {/* Mic button */}
          {speechSupported && (
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSpeech}
              disabled={isStreaming}
              className={cn("shrink-0", isListening ? "text-red-500 animate-pulse" : "text-muted-foreground hover:text-foreground")}
              title={isListening ? "Berhenti merekam" : "Bicara"}
              data-testid="button-voice-input"
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </Button>
          )}

          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isListening ? "Sedang mendengarkan..." : "Ketik pesan..."}
            className="resize-none min-h-[44px] max-h-[120px]"
            rows={1}
            disabled={isStreaming || isListening}
            data-testid="input-chat-message"
          />

          {/* TTS toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => { setVoiceMode(v => !v); if (isSpeaking) stopSpeaking(); }}
            className={cn("shrink-0", voiceMode ? "text-primary" : "text-muted-foreground hover:text-foreground")}
            title={voiceMode ? "Matikan suara balasan" : "Aktifkan suara balasan"}
            data-testid="button-voice-mode"
          >
            {voiceMode ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </Button>

          <Button
            onClick={sendMessage}
            disabled={(!input.trim() && pendingFiles.length === 0) || isStreaming}
            size="icon"
            data-testid="button-send-message"
          >
            {isStreaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileSelect}
          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.jpg,.jpeg,.png,.gif,.webp,.svg,.mp3,.wav,.webm,.ogg,.mp4,.mov,.zip,.rar"
          data-testid="input-file-hidden"
        />
      </div>
    </div>
  );
}