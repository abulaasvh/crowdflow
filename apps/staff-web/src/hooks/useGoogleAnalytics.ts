/**
 * Google Analytics 4 Hook
 *
 * Tracks page views, user interactions, and custom events.
 * Uses gtag.js loaded dynamically to avoid blocking page load.
 */

import { useEffect, useCallback } from 'react';
import { GOOGLE_SERVICES } from '@crowdflow/shared-types';

declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
    dataLayer: unknown[];
  }
}

let initialized = false;

function initGA(measurementId: string) {
  if (initialized || !measurementId || measurementId.startsWith('G-XXXX')) return;

  // Load gtag.js script dynamically
  const script = document.createElement('script');
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  script.async = true;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer.push(arguments);
  };
  window.gtag('js', new Date());
  window.gtag('config', measurementId, {
    send_page_view: false, // We'll send manually for SPA
  });

  initialized = true;
}

/**
 * Hook for Google Analytics 4 event tracking.
 *
 * Usage:
 *   const { trackEvent, trackPageView } = useGoogleAnalytics();
 *   trackPageView('/dashboard');
 *   trackEvent('zone_click', { zone_id: 'section-a' });
 */
export function useGoogleAnalytics() {
  const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID || '';

  useEffect(() => {
    initGA(measurementId);
  }, [measurementId]);

  const trackPageView = useCallback((path: string, title?: string) => {
    if (!initialized) return;
    window.gtag('event', GOOGLE_SERVICES.GA_EVENTS.PAGE_VIEW, {
      page_path: path,
      page_title: title || document.title,
    });
  }, []);

  const trackEvent = useCallback(
    (eventName: string, params?: Record<string, string | number | boolean>) => {
      if (!initialized) return;
      window.gtag('event', eventName, params);
    },
    [],
  );

  const trackLogin = useCallback((method: string) => {
    if (!initialized) return;
    window.gtag('event', GOOGLE_SERVICES.GA_EVENTS.LOGIN, { method });
  }, []);

  const trackMapInteraction = useCallback(
    (zoneId: string, action: string) => {
      if (!initialized) return;
      window.gtag('event', GOOGLE_SERVICES.GA_EVENTS.MAP_INTERACTION, {
        zone_id: zoneId,
        action,
      });
    },
    [],
  );

  const trackAlertAcknowledged = useCallback((alertId: string) => {
    if (!initialized) return;
    window.gtag('event', GOOGLE_SERVICES.GA_EVENTS.ALERT_ACKNOWLEDGED, {
      alert_id: alertId,
    });
  }, []);

  return {
    trackPageView,
    trackEvent,
    trackLogin,
    trackMapInteraction,
    trackAlertAcknowledged,
  };
}
