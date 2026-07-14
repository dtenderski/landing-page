import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, ThumbsUp, ThumbsDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useParams, useSearch } from "wouter";
import { cn } from "@/lib/utils";
import { MessageContent } from "@/lib/format-message";
import { parseBrainUpdates, BrainChip } from "@/lib/brain-utils";
import { usePartnerBranding } from "@/hooks/use-partner-branding";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function EmbedChat() {
  const params = useParams<{ agentId: string }>();
  const search = useSearch();
  const searchParams = new URLSearchParams(search);
  const { partner: partnerBranding } = usePartnerBranding();
  
  const color = searchParams.get("color") || "#6366f1";
  const name = searchParams.get("name") || "AI Assistant";
  const avatar = searchParams.get("avatar") || "";
  const welcome = searchParams.get("welcome") || "Halo! Ada yang bisa saya bantu?";
  const branding = searchParams.get("branding") !== "false" && !partnerBranding?.hidePlatformBranding;
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationStarters, setConversationStarters] = useState<string[]>([]);
  const [rating, setRating] = useState<"up" | "down" | null>(null);
  const [showRating, setShowRating] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const sessionIdRef = useRef(`embed_${params.agentId}_${Date.now()}`);

  useEffect(() => {
    if (params.agentId) {
      fetch(`/api/widget/config/${params.agentId}`)
        .then(res => res.json())
        .then(config => {
          if (config.conversationStarters && config.conversationStarters.length > 0) {
            setConversationStarters(config.conversationStarters.slice(0, 4));
          }
        })
        .catch(console.error);
    }
  }, [params.agentId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: content.trim(),
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setShowRating(false);
    
    try {
      const response = await fetch("/api/messages/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId: params.agentId,
          role: "user",
          content: content.trim(),
          sessionId: sessionIdRef.current,
        }),
      });
      
      // Resolve human-readable error before adding assistant bubble
      if (!response.ok) {
        let errText = "Maaf, terjadi kesalahan. Silakan coba lagi.";
        try {
          const errData = await response.json();
          if (response.status === 429) errText = "Kuota pesan habis. Silakan daftar untuk melanjutkan.";
          else if (response.status === 503) errText = errData.error || "Chatbot sedang tidak aktif.";
          else if (errData.error) errText = errData.error;
        } catch {}
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(), role: "assistant" as const,
          content: errText, timestamp: new Date(),
        }]);
        return;
      }

      const assistantId = (Date.now() + 1).toString();
      setMessages(prev => [...prev, {
        id: assistantId, role: "assistant" as const, content: "", timestamp: new Date(),
      }]);

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";
      
      while (reader) {
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
                assistantContent += parsed.content;
                const displayContent = assistantContent
                  .replace(/\[SAVE_MEMORY:(memory|note)\][\s\S]*?\[\/SAVE_MEMORY\]/g, "")
                  .replace(/\[DELETE_MEMORY\][\s\S]*?\[\/DELETE_MEMORY\]/g, "")
                  .replace(/\[SAVE_MEMORY:(memory|note)\][\s\S]*$/g, "")
                  .replace(/\[DELETE_MEMORY\][\s\S]*$/g, "")
                  .trim();
                setMessages(prev => {
                  const updated = [...prev];
                  const lastIdx = updated.length - 1;
                  if (updated[lastIdx]?.role === "assistant") {
                    updated[lastIdx] = { ...updated[lastIdx], content: displayContent };
                  }
                  return updated;
                });
              }
            } catch {}
          }
        }
      }
      
      setShowRating(true);
    } catch (error) {
      console.error("Chat error:", error);
      // Update last assistant bubble if it exists (empty), otherwise append
      setMessages(prev => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last?.role === "assistant" && !last.content) {
          updated[updated.length - 1] = { ...last, content: "Maaf, terjadi kesalahan. Silakan coba lagi." };
          return updated;
        }
        return [...prev, {
          id: (Date.now() + 1).toString(), role: "assistant" as const,
          content: "Maaf, terjadi kesalahan. Silakan coba lagi.", timestamp: new Date(),
        }];
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const handleRating = async (type: "up" | "down") => {
    setRating(type);
    try {
      await fetch("/api/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId: params.agentId,
          eventType: "chat_rating",
          metadata: { rating: type, messageCount: messages.length },
        }),
      });
    } catch {}
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <div 
        className="p-3 flex items-center gap-3 border-b"
        style={{ backgroundColor: color }}
      >
        <Avatar className="w-9 h-9 border-2 border-white/30">
          {avatar ? (
            <AvatarImage src={avatar} alt={name} className="object-cover" />
          ) : null}
          <AvatarFallback className="bg-white/20 text-white text-sm">
            {name.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-white truncate">{name}</h3>
          <p className="text-xs text-white/70">Online</p>
        </div>
      </div>

      <ScrollArea className="flex-1" ref={scrollRef}>
        <div className="p-4 space-y-4">
          <div className="flex gap-3">
            <Avatar className="w-8 h-8 shrink-0">
              {avatar ? (
                <AvatarImage src={avatar} alt={name} className="object-cover" />
              ) : null}
              <AvatarFallback className="text-xs" style={{ backgroundColor: `${color}20`, color }}>
                {name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-1 max-w-[80%]">
              <span className="text-[10px] text-muted-foreground">{name}</span>
              <div className="rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm bg-muted">
                {welcome}
              </div>
            </div>
          </div>

          {conversationStarters.length > 0 && messages.length === 0 && (
            <div className="flex flex-wrap gap-2 pl-11">
              {conversationStarters.map((starter, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  size="sm"
                  className="text-xs h-auto py-1.5 px-3"
                  onClick={() => sendMessage(starter)}
                 
                >
                  {starter}
                </Button>
              ))}
            </div>
          )}

          {messages.map((message) => {
            const isUser = message.role === "user";
            const { fields: brainFields, cleanContent } = !isUser
              ? parseBrainUpdates(message.content)
              : { fields: [], cleanContent: message.content };
            return (
              <div key={message.id} className={cn("flex gap-3", isUser && "flex-row-reverse")}>
                <Avatar className="w-8 h-8 shrink-0">
                  {!isUser && avatar ? (
                    <AvatarImage src={avatar} alt={name} className="object-cover" />
                  ) : null}
                  <AvatarFallback
                    className="text-xs"
                    style={!isUser ? { backgroundColor: `${color}20`, color } : {}}
                  >
                    {isUser ? <User className="w-4 h-4" /> : name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col gap-1 max-w-[80%]">
                  <span className={cn("text-[10px] text-muted-foreground", isUser && "text-right")}>
                    {isUser ? "Anda" : name}
                  </span>
                  <div
                    className={cn(
                      "rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap break-words",
                      isUser
                        ? "rounded-tr-sm text-white"
                        : "bg-muted rounded-tl-sm"
                    )}
                    style={isUser ? { backgroundColor: color } : {}}
                  >
                    {isUser ? message.content : <MessageContent text={cleanContent} />}
                  </div>
                  {!isUser && <BrainChip fields={brainFields} />}
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex gap-3">
              <Avatar className="w-8 h-8 shrink-0">
                <AvatarFallback className="text-xs" style={{ backgroundColor: `${color}20`, color }}>
                  {name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex gap-1.5 items-center">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Mengetik...</span>
                </div>
              </div>
            </div>
          )}

          {showRating && !rating && messages.length > 0 && (
            <div className="flex items-center justify-center gap-2 py-2">
              <span className="text-xs text-muted-foreground">Apakah respons ini membantu?</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2"
                onClick={() => handleRating("up")}
               
              >
                <ThumbsUp className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2"
                onClick={() => handleRating("down")}
               
              >
                <ThumbsDown className="w-4 h-4" />
              </Button>
            </div>
          )}

          {rating && (
            <div className="text-center py-2">
              <span className="text-xs text-muted-foreground">
                Terima kasih atas feedback Anda!
              </span>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-3 border-t bg-background/80 backdrop-blur-sm">
        <div className="flex gap-2 items-end">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = `${Math.min(e.target.scrollHeight, 80)}px`;
            }}
            onKeyDown={handleKeyDown}
            placeholder="Ketik pesan..."
            className="min-h-[40px] max-h-[80px] resize-none text-sm rounded-xl"
            rows={1}
            disabled={isLoading}
           
          />
          <Button
            size="icon"
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isLoading}
            className="shrink-0 h-10 w-10 rounded-xl"
            style={{ backgroundColor: color }}
           
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        {branding && (
          <p className="text-[10px] text-muted-foreground text-center mt-2">
            Powered by <span className="font-medium">Gustafta</span>
          </p>
        )}
      </div>
    </div>
  );
}
