/**
 * GA4 퍼널 이벤트
 *
 * 퍼널 순서:
 * opening_start → dialogue_start → input_name → input_gender
 * → input_birthdate → input_birthtime → input_city → submit
 * → result_view → upsell_view → purchase_click → purchase_complete
 * → gungham_click → redo_click → pdf_download
 *
 * 육효점:
 * hyo_start → hyo_stage_N → hyo_complete → hyo_copy
 */

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

export function trackEvent(eventName: string, params?: Record<string, any>) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, params);
  }
}
