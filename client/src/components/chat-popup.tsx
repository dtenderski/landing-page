import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, MessageCircle, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useMessages, useSendMessage } from "@/hooks/use-chat";
import { cn } from "@/lib/utils";
import { MessageContent } from "@/lib/format-message";
import { parseBrainUpdates, BrainChip } from "@/lib/brain-utils";
import type { Agent, Message } from "@shared/schema";

interface ChatPopupProps {
  agent: Agent;
}

export function ChatPopup({ agent }: ChatPopupProps) {
  const { data: messages = [], isLoading } = useMessages(agent.id);
  const sendMessage = useSendMessage();
  const [input, setInput] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (scrollRef.current && isOpen) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isOpen]);

  const handleSend = () => {
    if (!input.trim()) return;

    sendMessage.mutate(
      { agentId: agent.id, role: "user", content: input.trim(), reasoning: "", sources: [] },
      {
        onSuccess: () => {
          setInput("");
          if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
          }
        },
      }
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const recentMessages = messages.slice(-50);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Chat Window */}
      <div
        className={cn(
          "absolute bottom-16 right-0 w-[360px] max-w-[calc(100vw-2rem)] bg-card border border-border rounded-xl shadow-2xl overflow-hidden transition-all duration-300 origin-bottom-right",
          isOpen
            ? "scale-100 opacity-100 pointer-events-auto"
            : "scale-95 opacity-0 pointer-events-none"
        )}
       
      >
        {/* Header */}
        <div className="bg-primary p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10 border-2 border-primary-foreground/30">
              {agent.avatar && agent.avatar.trim() !== "" ? (
                <AvatarImage src={agent.avatar} alt={agent.name} className="object-cover" />
              ) : null}
              <AvatarFallback className="bg-primary-foreground/20 text-primary-foreground">
                {agent.name ? agent.name.substring(0, 2).toUpperCase() : <Bot className="w-5 h-5" />}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-sm font-semibold text-primary-foreground">
                {agent.name}
              </h3>
              <p className="text-xs text-primary-foreground/80">
                {agent.tagline || "Asisten AI"}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
            className="text-primary-foreground hover:bg-primary-foreground/20"
           
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Messages Area */}
        <ScrollArea className="h-[400px] max-h-[60vh]" ref={scrollRef}>
          <div className="p-4 space-y-4">
            {/* Greeting Message from Agent */}
            {recentMessages.length === 0 && !isLoading && (
              <div className="flex gap-3">
                <Avatar className="w-8 h-8 shrink-0">
                  {agent.avatar && agent.avatar.trim() !== "" ? (
                    <AvatarImage src={agent.avatar} alt={agent.name} className="object-cover" />
                  ) : null}
                  <AvatarFallback className="text-xs bg-primary/10 text-primary">
                    {agent.name ? agent.name.substring(0, 2).toUpperCase() : <Bot className="w-4 h-4" />}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col gap-1 max-w-[75%]">
                  <span className="text-[10px] text-muted-foreground">{agent.name}</span>
                  <div className="rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm bg-muted">
                    {agent.greetingMessage || `Halo! Selamat datang di ${agent.name}. Ada yang bisa saya bantu?`}
                  </div>
                </div>
              </div>
            )}

            {isLoading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="flex gap-3 animate-pulse">
                    <div className="w-8 h-8 rounded-full bg-muted" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-3/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              recentMessages.map((message) => (
                <ChatBubble key={message.id} message={message} agentName={agent.name} agentAvatar={agent.avatar} />
              ))
            )}

            {sendMessage.isPending && (
              <div className="flex gap-3">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="text-xs bg-primary/10 text-primary">
                    <Bot className="w-4 h-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" />
                    <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                    <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="p-4 border-t border-border bg-background/50">
          <div className="flex gap-2 items-end">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = `${Math.min(e.target.scrollHeight, 100)}px`;
              }}
              onKeyDown={handleKeyDown}
              placeholder="Ketik pesan Anda..."
              className="min-h-[44px] max-h-[100px] resize-none text-sm rounded-xl"
              rows={1}
             
            />
            <Button
              size="icon"
              onClick={handleSend}
              disabled={!input.trim() || sendMessage.isPending}
              className="shrink-0 h-11 w-11 rounded-xl"
             
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground text-center mt-2">
            Powered by Gustafta
          </p>
        </div>
      </div>

      {/* Floating Button with Slow Pulse Animation */}
      <div className="relative">
        {!isOpen && (
          <span className="absolute inset-0 w-14 h-14 rounded-full bg-primary animate-slow-ping" />
        )}
        <Button
          onClick={() => setIsOpen(!isOpen)}
          size="icon"
          className={cn(
            "relative w-14 h-14 rounded-full shadow-lg transition-all duration-200",
            !isOpen && "animate-slow-pulse"
          )}
         
        >
          {isOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <MessageCircle className="w-6 h-6" />
          )}
        </Button>
      </div>

      {/* Unread indicator badge */}
      {!isOpen && recentMessages.length > 0 && (
        <span className="absolute top-0 right-0 w-5 h-5 bg-destructive text-destructive-foreground text-xs font-bold rounded-full flex items-center justify-center animate-bounce">
          {Math.min(recentMessages.length, 9)}
          {recentMessages.length > 9 && "+"}
        </span>
      )}
    </div>
  );
}

function ChatBubble({ message, agentName, agentAvatar }: { message: Message; agentName: string; agentAvatar?: string }) {
  const isUser = message.role === "user";
  const { fields: brainFields, cleanContent } = !isUser
    ? parseBrainUpdates(message.content)
    : { fields: [], cleanContent: message.content };

  return (
    <div className={cn("flex gap-3", isUser && "flex-row-reverse")}>
      <Avatar className="w-8 h-8 shrink-0">
        {!isUser && agentAvatar && agentAvatar.trim() !== "" ? (
          <AvatarImage src={agentAvatar} alt={agentName} className="object-cover" />
        ) : null}
        <AvatarFallback
          className={cn(
            "text-xs",
            isUser ? "bg-secondary" : "bg-primary/10 text-primary"
          )}
        >
          {isUser ? <User className="w-4 h-4" /> : (agentName ? agentName.substring(0, 2).toUpperCase() : <Bot className="w-4 h-4" />)}
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col gap-1 max-w-[75%]">
        <span className={cn("text-[10px] text-muted-foreground", isUser && "text-right")}>
          {isUser ? "Anda" : agentName}
        </span>
        <div
          className={cn(
            "rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap break-words",
            isUser
              ? "bg-primary text-primary-foreground rounded-tr-sm"
              : "bg-muted rounded-tl-sm"
          )}
        >
          {isUser ? message.content : <MessageContent text={cleanContent} />}
        </div>
        {!isUser && <BrainChip fields={brainFields} />}
      </div>
    </div>
  );
}
