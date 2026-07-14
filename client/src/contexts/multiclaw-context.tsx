import { createContext, useContext, useState, useEffect, useCallback } from "react";

export interface TenderCtx {
  tenderName: string;
  tenderAgency: string;
  overallScore: number;
  recommendation: string;
  keyGaps: string[];
  packType: string;
  savedAt: string;
}

export interface StudioCtx {
  proposalName: string;
  qualityBefore: number;
  qualityAfter: number;
  enhancedFields: string[];
  additionalChunks: number;
  savedAt: string;
}

export interface EkosistemCtx {
  agentName: string;
  ebookTitle: string;
  ecourseTitle: string;
  docgenCount: number;
  savedAt: string;
}

interface MultiClawCtxValue {
  tenderCtx: TenderCtx | null;
  studioCtx: StudioCtx | null;
  ekosistemCtx: EkosistemCtx | null;
  setTenderCtx: (ctx: TenderCtx) => void;
  setStudioCtx: (ctx: StudioCtx) => void;
  setEkosistemCtx: (ctx: EkosistemCtx) => void;
  clearAll: () => void;
}

const MultiClawContext = createContext<MultiClawCtxValue>({
  tenderCtx: null,
  studioCtx: null,
  ekosistemCtx: null,
  setTenderCtx: () => {},
  setStudioCtx: () => {},
  setEkosistemCtx: () => {},
  clearAll: () => {},
});

const STORAGE_KEY = "gustafta_multiclaw_ctx_v1";

export function MultiClawProvider({ children }: { children: React.ReactNode }) {
  const [tenderCtx, setTenderCtxState] = useState<TenderCtx | null>(null);
  const [studioCtx, setStudioCtxState] = useState<StudioCtx | null>(null);
  const [ekosistemCtx, setEkosistemCtxState] = useState<EkosistemCtx | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.tenderCtx) setTenderCtxState(parsed.tenderCtx);
        if (parsed.studioCtx) setStudioCtxState(parsed.studioCtx);
        if (parsed.ekosistemCtx) setEkosistemCtxState(parsed.ekosistemCtx);
      }
    } catch {}
  }, []);

  const persist = useCallback((patch: Record<string, any>) => {
    try {
      const current = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...current, ...patch }));
    } catch {}
  }, []);

  const setTenderCtx = useCallback((ctx: TenderCtx) => {
    setTenderCtxState(ctx);
    persist({ tenderCtx: ctx });
  }, [persist]);

  const setStudioCtx = useCallback((ctx: StudioCtx) => {
    setStudioCtxState(ctx);
    persist({ studioCtx: ctx });
  }, [persist]);

  const setEkosistemCtx = useCallback((ctx: EkosistemCtx) => {
    setEkosistemCtxState(ctx);
    persist({ ekosistemCtx: ctx });
  }, [persist]);

  const clearAll = useCallback(() => {
    setTenderCtxState(null);
    setStudioCtxState(null);
    setEkosistemCtxState(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <MultiClawContext.Provider value={{ tenderCtx, studioCtx, ekosistemCtx, setTenderCtx, setStudioCtx, setEkosistemCtx, clearAll }}>
      {children}
    </MultiClawContext.Provider>
  );
}

export function useMultiClaw() {
  return useContext(MultiClawContext);
}
