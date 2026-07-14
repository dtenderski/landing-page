import { useState } from "react";
import { useLocation } from "wouter";
import { Bell, Check, Share2, ShieldCheck, ShieldX, type LucideIcon } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { NOTIFICATION_TYPES } from "@shared/schema";

type NotificationItem = {
  id: number;
  type: string;
  title: string;
  message: string;
  link: string | null;
  agentId: number | null;
  read: boolean;
  createdAt: string;
};

type NotificationsResponse = {
  items: NotificationItem[];
  unread: number;
};

// Ikon + warna per jenis notifikasi. Sertifikasi pakai perisai: hijau "diberi",
// abu "dicabut". Tipe eksplisit (Loop #12) `agent_certification_granted`/`_revoked`
// dipilih dari `type` — bukan menebak judul. Legacy `agent_certification` (data
// lama, sebelum tipe dipisah) tetap didukung via parsing judul. Selain itu → Share2.
const GRANT_VISUAL = { Icon: ShieldCheck, wrap: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" };
const REVOKE_VISUAL = { Icon: ShieldX, wrap: "bg-muted text-muted-foreground" };
function visualFor(n: NotificationItem): { Icon: LucideIcon; wrap: string } {
  if (n.type === NOTIFICATION_TYPES.AGENT_CERTIFICATION_GRANTED) return GRANT_VISUAL;
  if (n.type === NOTIFICATION_TYPES.AGENT_CERTIFICATION_REVOKED) return REVOKE_VISUAL;
  if (n.type === NOTIFICATION_TYPES.AGENT_CERTIFICATION_LEGACY) {
    return /dicabut/i.test(n.title) ? REVOKE_VISUAL : GRANT_VISUAL;
  }
  return { Icon: Share2, wrap: "bg-primary/10 text-primary" };
}

function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "baru saja";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} hari lalu`;
  return date.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [, setLocation] = useLocation();

  const { data } = useQuery<NotificationsResponse>({
    queryKey: ["/api/notifications"],
    refetchInterval: 60_000,
  });

  const items = data?.items ?? [];
  const unread = data?.unread ?? 0;

  const markRead = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("POST", `/api/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/notifications/read-all");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });

  const handleClick = (n: NotificationItem) => {
    if (!n.read) markRead.mutate(n.id);
    setOpen(false);
    if (n.link) setLocation(n.link);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label="Notifikasi"
          data-testid="button-notifications"
        >
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <span
              className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-semibold flex items-center justify-center"
              data-testid="badge-notifications-unread"
            >
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0" data-testid="popover-notifications">
        <div className="flex items-center justify-between px-3 py-2 border-b border-border">
          <span className="font-semibold text-sm">Notifikasi</span>
          {unread > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
              data-testid="button-mark-all-read"
            >
              <Check className="h-3 w-3" />
              Tandai semua dibaca
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-80">
          {items.length === 0 ? (
            <div
              className="px-4 py-8 text-center text-sm text-muted-foreground"
              data-testid="text-notifications-empty"
            >
              Belum ada notifikasi
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {items.map((n) => {
                const { Icon, wrap } = visualFor(n);
                return (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => handleClick(n)}
                    className={cn(
                      "w-full text-left px-3 py-3 flex gap-3 hover:bg-muted/60 transition-colors",
                      !n.read && "bg-primary/5",
                    )}
                    data-testid={`item-notification-${n.id}`}
                  >
                    <div className="mt-0.5 shrink-0">
                      <span className={cn("w-7 h-7 rounded-full flex items-center justify-center", wrap)}>
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium leading-snug">{n.title}</p>
                      {n.message && (
                        <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                          {n.message}
                        </p>
                      )}
                      <p className="text-[11px] text-muted-foreground mt-1">
                        {timeAgo(n.createdAt)}
                      </p>
                    </div>
                    {!n.read && (
                      <span className="mt-1 w-2 h-2 rounded-full bg-primary shrink-0" />
                    )}
                  </button>
                </li>
                );
              })}
            </ul>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
