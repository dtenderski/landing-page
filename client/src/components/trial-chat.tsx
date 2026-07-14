import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, MessageSquare, Minimize2, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useMessages, useSendMessage } from "@/hooks/use-chat";
import { cn } from "@/lib/utils";
import { MessageContent } from "@/lib/format-message";
import { parseBrainUpdates, BrainChip } from "@/lib/brain-utils";
import type { Agent, Message } from "@shared/schema";

interface TrialChatProps {
  agent: Agent;
}

export function TrialChat({ agent }: TrialChatProps) {
  const { data: messages = [], isLoading } = useMessages(agent.id);
  const sendMessage = useSendMessage();
  const [input, setInput] = useState("");
  const [isMinimized, setIsMinimized] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (scrollRef.current && !isMinimized) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isMinimized]);

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

  const recentMessages = messages.slice(-20);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-3 border-b flex items-center justify-between bg-card">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <MessageSquare className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-medium">Trial Chat</h3>
            <p className="text-xs text-muted-foreground">Test your chatbot</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsMinimized(!isMinimized)}
         
        >
          {isMinimized ? (
            <Maximize2 className="w-4 h-4" />
          ) : (
            <Minimize2 className="w-4 h-4" />
          )}
        </Button>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <ScrollArea className="flex-1" ref={scrollRef}>
            <div className="p-3 space-y-3">
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <div key={i} className="flex gap-2 animate-pulse">
                      <div className="w-6 h-6 rounded-full bg-muted" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3 bg-muted rounded w-2/3" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentMessages.length === 0 ? (
                <div className="text-center py-8">
                  <Bot className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-xs text-muted-foreground">
                    Send a message to start testing
                  </p>
                </div>
              ) : (
                recentMessages.map((message) => (
                  <TrialMessageBubble key={message.id} message={message} />
                ))
              )}
              {sendMessage.isPending && (
                <div className="flex gap-2">
                  <Avatar className="w-6 h-6">
                    <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                      <Bot className="w-3 h-3" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex gap-1 items-center">
                    <span className="w-1.5 h-1.5 bg-primary/50 rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                    <span className="w-1.5 h-1.5 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="p-3 border-t">
            <div className="flex gap-2">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 80)}px`;
                }}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                className="min-h-[36px] max-h-[80px] resize-none text-sm"
                rows={1}
               
              />
              <Button
                size="icon"
                onClick={handleSend}
                disabled={!input.trim() || sendMessage.isPending}
               
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function TrialMessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  const { fields: brainFields, cleanContent } = !isUser
    ? parseBrainUpdates(message.content)
    : { fields: [], cleanContent: message.content };

  return (
    <div className={cn("flex gap-2", isUser && "flex-row-reverse")}>
      <Avatar className="w-6 h-6 shrink-0">
        <AvatarFallback className={cn("text-[10px]", isUser ? "bg-secondary" : "bg-primary/10 text-primary")}>
          {isUser ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col gap-1 min-w-0">
        <div
          className={cn(
            "max-w-[80%] rounded-lg px-2.5 py-1.5 text-xs break-words",
            isUser ? "bg-primary text-primary-foreground whitespace-pre-wrap" : "bg-muted"
          )}
        >
          {isUser ? message.content : <MessageContent text={cleanContent} className="text-xs space-y-1" />}
        </div>
        {!isUser && <BrainChip fields={brainFields} />}
      </div>
    </div>
  );
}
