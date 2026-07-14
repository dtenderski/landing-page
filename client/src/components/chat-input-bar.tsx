import { useState, useRef, useCallback, useEffect } from "react";
import { Paperclip, Send, Loader2, X, FileText, Image as ImageIcon, Copy, Check, ThumbsUp, ThumbsDown, Mic, MicOff, Music, Video, File, Phone, PhoneOff } from "lucide-react";

/** Strip markdown symbols so text-to-speech doesn't read "asterisk asterisk" etc. */
export function stripMarkdownForSpeech(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[*_#>~-]{1,3}/g, " ")
    .replace(/\|/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export interface ChatAttachment {
  fileName: string;
  fileUrl: string;
  category: string;
  mimeType?: string;
  fileSize?: number;
  previewUrl?: string;
}

interface ChatInputBarProps {
  onSend: (text: string, files: ChatAttachment[]) => Promise<void> | void;
  disabled?: boolean;
  streaming?: boolean;
  placeholder?: string;
  footerText?: string;
  showClear?: boolean;
  onClear?: () => void;
  /** Latest assistant reply text — when provided, enables "Mode Telpon" (phone call voice loop). */
  lastAIMessage?: string;
}

export function ChatInputBar({
  onSend,
  disabled = false,
  streaming = false,
  placeholder = "Ketik pesan…",
  footerText,
  showClear = false,
  onClear,
  lastAIMessage,
}: ChatInputBarProps) {
  const [input, setInput] = useState("");
  const [pendingFiles, setPendingFiles] = useState<ChatAttachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [phoneMode, setPhoneMode] = useState(false);
  const [aiSpeaking, setAiSpeaking] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const sendRef = useRef<() => void>(() => {});
  const phoneModeRef = useRef(false);
  const aiSpeakingRef = useRef(false);
  const lastSpokenRef = useRef<string | undefined>(undefined);

  useEffect(() => { phoneModeRef.current = phoneMode; }, [phoneMode]);
  useEffect(() => { aiSpeakingRef.current = aiSpeaking; }, [aiSpeaking]);

  // Mode Telpon: baca balasan AI dengan suara, lalu otomatis dengarkan lagi.
  // Mic is explicitly stopped before speaking (defense against the mic picking up
  // the AI's own voice through speakers and self-triggering a reply loop).
  useEffect(() => {
    const synth = (window as any).speechSynthesis;
    if (!phoneMode || !synth || !lastAIMessage || lastAIMessage === lastSpokenRef.current) return;
    lastSpokenRef.current = lastAIMessage;
    if (recognitionRef.current) { try { recognitionRef.current.stop(); } catch { /* noop */ } }
    synth.cancel();
    const utter = new SpeechSynthesisUtterance(stripMarkdownForSpeech(lastAIMessage));
    utter.lang = "id-ID";
    utter.onstart = () => setAiSpeaking(true);
    utter.onend = () => {
      setAiSpeaking(false);
      if (phoneModeRef.current && recognitionRef.current) {
        try { recognitionRef.current.start(); } catch { /* already started */ }
      }
    };
    utter.onerror = () => setAiSpeaking(false);
    synth.speak(utter);
  }, [lastAIMessage, phoneMode]);

  const togglePhoneMode = () => {
    const synth = (window as any).speechSynthesis;
    setPhoneMode(prev => {
      const next = !prev;
      if (!next) {
        synth?.cancel();
        setAiSpeaking(false);
        if (recognitionRef.current && isListening) recognitionRef.current.stop();
      } else if (recognitionRef.current && !isListening) {
        try { recognitionRef.current.start(); } catch { /* noop */ }
      }
      return next;
    });
  };

  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  }, []);

  useEffect(() => { autoResize(); }, [input, autoResize]);

  // Wire up Web Speech API
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    setSpeechSupported(true);

    const recognition = new SpeechRecognition();
    recognition.lang = "id-ID";
    recognition.continuous = false;
    recognition.interimResults = true;

    let finalTranscript = "";

    recognition.onstart = () => {
      setIsListening(true);
      finalTranscript = "";
    };

    recognition.onresult = (event: any) => {
      if (aiSpeakingRef.current) return; // ignore anything captured while the AI is speaking
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += t;
        } else {
          interim += t;
        }
      }
      setInput(finalTranscript + interim);
    };

    recognition.onend = () => {
      setIsListening(false);
      if (finalTranscript.trim()) {
        // Trigger send after state has settled
        setTimeout(() => sendRef.current(), 50);
      }
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
  }, []);

  const toggleMic = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setInput("");
      recognitionRef.current.start();
    }
  };

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      const uploaded: ChatAttachment[] = [];
      for (const file of files) {
        const fd = new FormData();
        fd.append("file", file);
        const r = await fetch("/api/chat/upload", { method: "POST", body: fd });
        if (!r.ok) continue;
        const data = await r.json();
        const att: ChatAttachment = { ...data };
        if (data.category === "image") att.previewUrl = URL.createObjectURL(file);

        // Auto-transcribe audio files → inject into input
        if (data.category === "audio") {
          try {
            const tf = new FormData();
            tf.append("file", file);
            const tr = await fetch("/api/chat/transcribe", { method: "POST", body: tf });
            if (tr.ok) {
              const td = await tr.json();
              if (td.transcript) {
                setInput(prev => prev ? `${prev}\n\n${td.transcript}` : td.transcript);
              }
            }
          } catch {
            // transcription optional — continue
          }
        }

        uploaded.push(att);
      }
      setPendingFiles(prev => [...prev, ...uploaded]);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleSend() {
    if ((!input.trim() && pendingFiles.length === 0) || disabled || streaming) return;
    const text = input;
    const files = [...pendingFiles];
    setInput("");
    setPendingFiles([]);
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    await onSend(text, files);
    textareaRef.current?.focus();
  }

  // Keep sendRef current so the speech onend callback always calls the latest handleSend
  sendRef.current = handleSend;

  const canSend = !disabled && !streaming && !isListening && (input.trim().length > 0 || pendingFiles.length > 0);

  const getFileIcon = (category: string) => {
    switch (category) {
      case "image": return <ImageIcon className="h-4 w-4 text-blue-400 shrink-0" />;
      case "audio": return <Music className="h-4 w-4 text-purple-400 shrink-0" />;
      case "video": return <Video className="h-4 w-4 text-pink-400 shrink-0" />;
      case "document": return <FileText className="h-4 w-4 text-slate-400 shrink-0" />;
      default: return <File className="h-4 w-4 text-slate-400 shrink-0" />;
    }
  };

  return (
    <div className="shrink-0 border-t border-white/10 px-4 pt-3 pb-2 bg-black/30">
      {pendingFiles.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {pendingFiles.map((att, idx) => (
            <div key={idx} className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-white/10 border border-white/20 text-xs text-white/70 max-w-[180px]">
              {att.category === "image" && att.previewUrl
                ? <img src={att.previewUrl} className="h-6 w-6 rounded object-cover shrink-0" alt="" />
                : getFileIcon(att.category)
              }
              <span className="truncate flex-1">{att.fileName}</span>
              <button onClick={() => setPendingFiles(p => p.filter((_, i) => i !== idx))} className="text-white/30 hover:text-white/80 shrink-0 ml-0.5" data-testid={`button-remove-attachment-${idx}`}>
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {isListening && (
        <div className="flex items-center gap-2 mb-2 px-1">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
          </span>
          <span className="text-xs text-red-400 font-medium">Mendengarkan… bicara sekarang</span>
        </div>
      )}

      {aiSpeaking && (
        <div className="flex items-center gap-2 mb-2 px-1">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
          </span>
          <span className="text-xs text-green-400 font-medium">AI sedang berbicara…</span>
        </div>
      )}

      {phoneMode && !isListening && !aiSpeaking && (
        <div className="flex items-center gap-2 mb-2 px-1">
          <Phone className="h-3 w-3 text-emerald-400" />
          <span className="text-xs text-emerald-400 font-medium">Mode Telpon aktif — tekan mic atau bicara saat siap</span>
        </div>
      )}

      <div className="flex items-end gap-2 rounded-xl border border-white/15 bg-white/5 px-3 py-2 focus-within:border-white/30 focus-within:ring-1 focus-within:ring-white/10 transition-all max-w-3xl mx-auto">
        {/* Attach file */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || uploading || isListening}
          className="shrink-0 mb-0.5 p-1.5 rounded-lg text-white/40 hover:text-white/70 hover:bg-white/10 disabled:opacity-30 transition-all"
          title="Lampirkan file (PDF, Word, Excel, gambar, audio, video)"
          data-testid="button-attach-file"
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
        </button>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.jpg,.jpeg,.png,.gif,.webp,.svg,.mp3,.wav,.webm,.ogg,.m4a,.mp4,.mov,.zip,.rar"
          className="hidden"
          onChange={handleFileSelect}
          data-testid="input-file-upload"
        />

        <textarea
          ref={textareaRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
          }}
          placeholder={isListening ? "Mendengarkan suara Anda…" : placeholder}
          disabled={(disabled && !streaming) || isListening}
          rows={1}
          className="flex-1 bg-transparent border-0 outline-none resize-none text-white placeholder:text-white/30 text-sm leading-relaxed py-0.5 max-h-[160px] overflow-y-auto"
          data-testid="input-message"
        />

        {/* Mode Telpon */}
        {speechSupported && lastAIMessage !== undefined && (
          <button
            onClick={togglePhoneMode}
            disabled={disabled || uploading}
            className={`shrink-0 mb-0.5 p-1.5 rounded-lg transition-all ${
              phoneMode
                ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                : "text-white/40 hover:text-white/70 hover:bg-white/10 disabled:opacity-30"
            }`}
            title={phoneMode ? "Matikan Mode Telpon" : "Mode Telpon — bicara & dengar seperti telepon"}
            data-testid="button-phone-mode"
          >
            {phoneMode ? <PhoneOff className="h-4 w-4" /> : <Phone className="h-4 w-4" />}
          </button>
        )}

        {/* Microphone */}
        {speechSupported && (
          <button
            onClick={toggleMic}
            disabled={disabled || uploading}
            className={`shrink-0 mb-0.5 p-1.5 rounded-lg transition-all ${
              isListening
                ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                : "text-white/40 hover:text-white/70 hover:bg-white/10 disabled:opacity-30"
            }`}
            title={isListening ? "Berhenti mendengarkan" : "Rekam suara"}
            data-testid="button-mic"
          >
            {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </button>
        )}

        {/* Send */}
        <button
          onClick={handleSend}
          disabled={!canSend}
          className={`shrink-0 mb-0.5 p-1.5 rounded-lg transition-all ${canSend ? "bg-white/20 hover:bg-white/30 text-white" : "text-white/20 cursor-not-allowed"}`}
          data-testid="button-send"
        >
          {streaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </button>
      </div>

      <div className="flex items-center justify-center gap-4 mt-1.5 max-w-3xl mx-auto">
        {footerText && <span className="text-[10px] text-white/20">{footerText}</span>}
        {showClear && onClear && (
          <button onClick={onClear} className="text-[10px] text-white/20 hover:text-white/50 transition-colors" data-testid="button-clear-chat">
            Bersihkan chat
          </button>
        )}
        <span className="text-[10px] text-white/15">PDF · Word · Excel · Gambar · Audio · Video</span>
      </div>
    </div>
  );
}

export function MessageActions({ content }: { content: string }) {
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null);

  function copy() {
    navigator.clipboard.writeText(content).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  }

  return (
    <div className="flex items-center gap-0.5 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
      <button onClick={copy} className="flex items-center gap-1 px-2 py-1 rounded text-[11px] text-white/40 hover:text-white/70 hover:bg-white/8 transition-all" title="Salin" data-testid="button-copy-message">
        {copied ? <><Check className="h-3 w-3 text-green-400" /><span className="text-green-400">Disalin!</span></> : <><Copy className="h-3 w-3" /><span>Salin</span></>}
      </button>
      <button onClick={() => setFeedback(f => f === "up" ? null : "up")} className={`p-1.5 rounded transition-all ${feedback === "up" ? "text-blue-400 bg-blue-900/40" : "text-white/30 hover:text-white/60 hover:bg-white/8"}`} title="Respons bagus" data-testid="button-thumbs-up">
        <ThumbsUp className="h-3 w-3" />
      </button>
      <button onClick={() => setFeedback(f => f === "down" ? null : "down")} className={`p-1.5 rounded transition-all ${feedback === "down" ? "text-red-400 bg-red-900/40" : "text-white/30 hover:text-white/60 hover:bg-white/8"}`} title="Perlu perbaikan" data-testid="button-thumbs-down">
        <ThumbsDown className="h-3 w-3" />
      </button>
    </div>
  );
}

export function AttachmentRow({ attachments }: { attachments: ChatAttachment[] }) {
  if (!attachments || attachments.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5 mb-1.5">
      {attachments.map((att, i) => (
        <div key={i} className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/10 border border-white/20 text-xs text-white/70 max-w-[160px]">
          {att.category === "image" && att.previewUrl
            ? <img src={att.previewUrl} className="h-5 w-5 rounded object-cover shrink-0" alt="" />
            : att.category === "image"
              ? <ImageIcon className="h-3.5 w-3.5 text-blue-400 shrink-0" />
              : att.category === "audio"
              ? <Music className="h-3.5 w-3.5 text-purple-400 shrink-0" />
              : att.category === "video"
              ? <Video className="h-3.5 w-3.5 text-pink-400 shrink-0" />
              : <FileText className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          }
          <span className="truncate">{att.fileName}</span>
        </div>
      ))}
    </div>
  );
}
