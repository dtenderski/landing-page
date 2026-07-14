import { useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { useAuth } from "@/hooks/use-auth";
import type { AppliedInviteGrant } from "@shared/schema";

async function fetchNewAgentGrants(): Promise<AppliedInviteGrant[]> {
  const res = await fetch("/api/me/new-agent-grants", { credentials: "include" });
  if (!res.ok) return [];
  return res.json();
}

// Shows a one-time first-login notice to a user who was just granted access to a
// shared agent via an email invite. The notice links directly to the agent.
export function NewAgentGrantsNotice() {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const shownRef = useRef(false);

  const { data: grants } = useQuery<AppliedInviteGrant[]>({
    queryKey: ["/api/me/new-agent-grants"],
    queryFn: fetchNewAgentGrants,
    enabled: isAuthenticated,
    retry: false,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (shownRef.current) return;
    if (!grants || grants.length === 0) return;
    shownRef.current = true;

    // Buka agen lewat deep-link dashboard (?agent=<id>). Dashboard memilih agen
    // pakai state lokal — tanpa endpoint /activate yang khusus pemilik — sehingga
    // kolaborator (Editor/Viewer) bisa langsung membuka agen yang dibagikan.
    const openAgent = (agentId: string) => {
      navigate(`/dashboard?agent=${agentId}`);
    };

    for (const grant of grants) {
      const roleLabel = grant.role === "editor" ? "Editor" : "Viewer";
      toast({
        title: "Anda kini punya akses agen baru",
        description: `Anda ditambahkan sebagai ${roleLabel} pada \u201C${grant.agentName}\u201D.`,
        action: (
          <ToastAction
            altText={`Buka ${grant.agentName}`}
            onClick={() => openAgent(grant.agentId)}
            data-testid={`button-open-granted-agent-${grant.agentId}`}
          >
            Buka
          </ToastAction>
        ),
      });
    }
  }, [grants, toast, navigate]);

  return null;
}
