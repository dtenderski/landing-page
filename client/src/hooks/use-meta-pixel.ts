import { useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { initMetaPixel, trackPageView } from '@/lib/meta-pixel';

export function useMetaPixel() {
  const [location] = useLocation();
  const initialized = useRef(false);

  useEffect(() => {
    initMetaPixel();
    initialized.current = true;
  }, []);

  // Fire a PageView on client-side (SPA) route changes, skipping the very first
  // render (the initial PageView is already sent by initMetaPixel).
  useEffect(() => {
    if (!initialized.current) return;
    trackPageView();
  }, [location]);
}

export function useTrackPageView(pageName?: string) {
  useEffect(() => {
    trackPageView();
  }, [pageName]);
}

export * from '@/lib/meta-pixel';
