import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAnalyticsSummary } from "@/hooks/use-analytics";
import { MessageSquare, Users, Zap, BarChart3, Clock, TrendingUp, Lightbulb, Target, Sparkles, CheckCircle2, Download, FileJson, FileSpreadsheet } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import type { Agent } from "@shared/schema";

interface AnalyticsPanelProps {
  agent: Agent;
}

export function AnalyticsPanel({ agent }: AnalyticsPanelProps) {
  const { data: analytics, isLoading } = useAnalyticsSummary(agent.id);
  const { toast } = useToast();

  const exportConversations = async (format: "json" | "csv") => {
    try {
      const response = await fetch(`/api/messages/${agent.id}/export/${format}`, {
        credentials: "include",
      });
      
      if (!response.ok) throw new Error("Export failed");
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${agent.name}_conversations_${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Export Berhasil",
        description: `Percakapan berhasil diekspor sebagai ${format.toUpperCase()}`,
      });
    } catch {
      toast({
        title: "Export Gagal",
        description: "Gagal mengekspor percakapan",
        variant: "destructive",
      });
    }
  };

  const getDayLabels = () => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const labels: string[] = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      labels.push(days[date.getDay()]);
    }
    return labels;
  };

  const formatHour = (hour: number) => {
    if (hour === 0) return "12 AM";
    if (hour === 12) return "12 PM";
    return hour < 12 ? `${hour} AM` : `${hour - 12} PM`;
  };

  const maxMessages = Math.max(...(analytics?.messagesLast7Days || [1]));
  
  const totalMessagesThisWeek = (analytics?.messagesLast7Days || []).reduce((a, b) => a + b, 0);
  const avgMessagesPerDay = totalMessagesThisWeek > 0 ? Math.round(totalMessagesThisWeek / 7) : 0;
  const avgMessagesPerSession = analytics?.totalSessions && analytics.totalSessions > 0 
    ? Math.round((analytics?.totalMessages || 0) / analytics.totalSessions) 
    : 0;
  
  const getInsights = () => {
    const insights: { icon: typeof Lightbulb; text: string; type: "success" | "warning" | "info" }[] = [];
    
    if ((analytics?.totalMessages || 0) > 100) {
      insights.push({ 
        icon: Sparkles, 
        text: "Chatbot Anda sangat aktif! Pertimbangkan untuk menambah fitur agentic AI.", 
        type: "success" 
      });
    }
    
    if (avgMessagesPerSession > 5) {
      insights.push({ 
        icon: CheckCircle2, 
        text: `Rata-rata ${avgMessagesPerSession} pesan per sesi - engagement yang bagus!`, 
        type: "success" 
      });
    } else if (avgMessagesPerSession > 0 && avgMessagesPerSession < 3) {
      insights.push({ 
        icon: Target, 
        text: "Tingkatkan engagement dengan conversation starters yang menarik.", 
        type: "warning" 
      });
    }
    
    if (!agent.greetingMessage) {
      insights.push({ 
        icon: Lightbulb, 
        text: "Tambahkan greeting message untuk menyambut pengunjung baru.", 
        type: "info" 
      });
    }
    
    if (analytics?.topHours && analytics.topHours.length > 0) {
      const peakHour = formatHour(analytics.topHours[0].hour);
      insights.push({ 
        icon: Clock, 
        text: `Jam tersibuk chatbot Anda adalah ${peakHour}.`, 
        type: "info" 
      });
    }
    
    return insights;
  };

  const insights = getInsights();

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Analytics</h2>
            <p className="text-muted-foreground mt-1">Track your chatbot performance and engagement</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export Percakapan
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => exportConversations("json")}>
                <FileJson className="w-4 h-4 mr-2" />
                Export sebagai JSON
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportConversations("csv")}>
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Export sebagai CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="h-16 bg-muted animate-pulse rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-primary/10">
                      <MessageSquare className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">
                        {analytics?.totalMessages || 0}
                      </p>
                      <p className="text-sm text-muted-foreground">Total Messages</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-green-500/10">
                      <Users className="w-6 h-6 text-green-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">
                        {analytics?.totalSessions || 0}
                      </p>
                      <p className="text-sm text-muted-foreground">Sessions</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-orange-500/10">
                      <Zap className="w-6 h-6 text-orange-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">
                        {analytics?.totalIntegrationCalls || 0}
                      </p>
                      <p className="text-sm text-muted-foreground">Integration Calls</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-muted-foreground" />
                  <CardTitle>Messages Last 7 Days</CardTitle>
                </div>
                <CardDescription>Daily message activity for your chatbot</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-48 flex items-end justify-between gap-2">
                  {(analytics?.messagesLast7Days || [0, 0, 0, 0, 0, 0, 0]).map((count, index) => {
                    const height = maxMessages > 0 ? (count / maxMessages) * 100 : 0;
                    return (
                      <div key={index} className="flex-1 flex flex-col items-center gap-2">
                        <div
                          className="w-full bg-primary/80 rounded-t-sm transition-all"
                          style={{ height: `${Math.max(height, 4)}%` }}
                          title={`${count} messages`}
                        />
                        <span className="text-xs text-muted-foreground">{getDayLabels()[index]}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {insights.length > 0 && (
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-primary" />
                    <CardTitle>Quick Insights</CardTitle>
                  </div>
                  <CardDescription>Rekomendasi berdasarkan data Anda</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {insights.map((insight, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <div className={`p-1.5 rounded-full ${
                          insight.type === "success" ? "bg-green-500/10" :
                          insight.type === "warning" ? "bg-amber-500/10" : "bg-primary/10"
                        }`}>
                          <insight.icon className={`w-4 h-4 ${
                            insight.type === "success" ? "text-green-500" :
                            insight.type === "warning" ? "text-amber-500" : "text-primary"
                          }`} />
                        </div>
                        <span className="text-sm text-foreground">{insight.text}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardContent className="p-6">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-primary">
                      {avgMessagesPerDay}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">Rata-rata pesan/hari</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-green-500">
                      {avgMessagesPerSession}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">Pesan per sesi</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-amber-500">
                      {totalMessagesThisWeek}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">Total minggu ini</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-muted-foreground" />
                    <CardTitle>Jam Tersibuk</CardTitle>
                  </div>
                  <CardDescription>Kapan chatbot Anda paling aktif</CardDescription>
                </CardHeader>
                <CardContent>
                  {analytics?.topHours && analytics.topHours.length > 0 ? (
                    <div className="space-y-3">
                      {analytics.topHours.map((item, index) => (
                        <div key={item.hour} className="flex items-center gap-3">
                          <span className="text-sm font-medium w-16">{formatHour(item.hour)}</span>
                          <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full"
                              style={{
                                width: `${(item.count / analytics.topHours[0].count) * 100}%`,
                              }}
                            />
                          </div>
                          <span className="text-sm text-muted-foreground w-12 text-right">
                            {item.count}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">
                      No activity data yet. Start chatting to see peak hours.
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-muted-foreground" />
                    <CardTitle>Performance Tips</CardTitle>
                  </div>
                  <CardDescription>Suggestions to improve engagement</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                      <span className="text-sm text-muted-foreground">
                        Add conversation starters to help users begin chatting
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                      <span className="text-sm text-muted-foreground">
                        Create a welcoming greeting message for new visitors
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                      <span className="text-sm text-muted-foreground">
                        Build a knowledge base to improve response accuracy
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                      <span className="text-sm text-muted-foreground">
                        Enable integrations to reach users on multiple platforms
                      </span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
