// Performance Marketing Tracking Scripts
// Handles Facebook Pixel, Google Ads, and other tracking integrations

export interface TrackingConfig {
  facebookPixelId?: string;
  googleAdsId?: string;
  googleAnalyticsId?: string;
  tiktokPixelId?: string;
  hotjarId?: string;
}

export interface TrackingEvent {
  event: string;
  parameters?: Record<string, any>;
}

// Default configuration (empty - configure via parameters)
export const DEFAULT_TRACKING_CONFIG: TrackingConfig = {};

// Facebook Pixel tracking
export function initFacebookPixel(pixelId: string): string {
  return `
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${pixelId}');
fbq('track', 'PageView');
  `.trim();
}

export function trackFacebookEvent(event: string, parameters?: Record<string, any>): void {
  if (typeof window === 'undefined' || !window.fbq) return;
  
  if (parameters) {
    window.fbq('track', event, parameters);
  } else {
    window.fbq('track', event);
  }
}

// Standard Facebook events
export function trackFacebookPageView(): void {
  trackFacebookEvent('PageView');
}

export function trackFacebookViewContent(contentId: string, value: number, currency: string = 'USD'): void {
  trackFacebookEvent('ViewContent', {
    content_ids: [contentId],
    value,
    currency,
  });
}

export function trackFacebookAddToCart(contentId: string, value: number, currency: string = 'USD'): void {
  trackFacebookEvent('AddToCart', {
    content_ids: [contentId],
    value,
    currency,
  });
}

export function trackFacebookPurchase(value: number, currency: string = 'USD'): void {
  trackFacebookEvent('Purchase', {
    value,
    currency,
  });
}

export function trackFacebookLead(): void {
  trackFacebookEvent('Lead');
}

export function trackFacebookCompleteRegistration(): void {
  trackFacebookEvent('CompleteRegistration');
}

// Google Ads tracking
export function initGoogleAds(conversionId: string): string {
  return `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${conversionId}');
  `.trim();
}

export function trackGoogleAdsConversion(conversionId: string, value: number, currency: string = 'USD'): void {
  if (typeof window === 'undefined' || !window.gtag) return;
  
  window.gtag('event', 'conversion', {
    send_to: conversionId,
    value,
    currency,
  });
}

// Google Analytics tracking
export function initGoogleAnalytics(measurementId: string): string {
  return `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${measurementId}');
  `.trim();
}

export function trackGAEvent(eventName: string, parameters?: Record<string, any>): void {
  if (typeof window === 'undefined' || !window.gtag) return;
  
  window.gtag('event', eventName, parameters);
}

export function trackGAPageView(pagePath: string, pageTitle: string): void {
  trackGAEvent('page_view', {
    page_path: pagePath,
    page_title: pageTitle,
  });
}

// TikTok Pixel tracking
export function initTikTokPixel(pixelId: string): string {
  return `
!function (w, d, t) {
  w.TiktokAnalyticsObject=t;var tq=w[t]=w[t]||[];tq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],tq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var r=0;r<tq.methods.length;r++){var e=tq.methods[r];tq.setAndDefer(tq,e)}tq.instance=function(t){for(var e=tq._i[t]||[],r=0;r<tq.methods.length;r++)tq.setAndDefer(e,tq.methods[r]);return tq._i[t]=e},tq.load=function(e,r){var n=document.createElement("script");n.type="text/javascript",n.async=!0,n.src="https://analytics.tiktok.com/i18n/pixel/events.js",n.addEventListener("load",function(){for(var e=tq.instance(r),o=window.TiktokAnalyticsObject[t]=window.TiktokAnalyticsObject[t]||[],i=0;i<tq.methods.length;i++)tq.setAndDefer(o,tq.methods[i])});var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(n,a)};tq.load('${pixelId}');
}(window, document, 'ttq');
  `.trim();
}

export function trackTikTokEvent(eventName: string, parameters?: Record<string, any>): void {
  if (typeof window === 'undefined' || !window.ttq) return;
  
  if (parameters) {
    window.ttq.track(eventName, parameters);
  } else {
    window.ttq.track(eventName);
  }
}

export function trackTikTokPageView(): void {
  trackTikTokEvent('PageView');
}

export function trackTikTokViewContent(contentId: string, price: number, currency: string = 'USD'): void {
  trackTikTokEvent('ViewContent', {
    content_id: contentId,
    price,
    currency,
  });
}

export function trackTikTokAddToCart(contentId: string, price: number, currency: string = 'USD'): void {
  trackTikTokEvent('AddToCart', {
    content_id: contentId,
    price,
    currency,
  });
}

export function trackTikTokCompletePayment(value: number, currency: string = 'USD'): void {
  trackTikTokEvent('CompletePayment', {
    value,
    currency,
  });
}

// Hotjar tracking
export function initHotjar(hotjarId: string, sv: number = 6): string {
  return `
(function(h,o,t,j,a,r){
  h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
  h._hjSettings={hjid:${hotjarId},hjsv:${sv}};
  a=o.getElementsByTagName('head')[0];
  r=o.createElement('script');r.async=1;
  r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
  a.appendChild(r);
})(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
  `.trim();
}

// Universal event tracking
export function trackEvent(platform: 'facebook' | 'google' | 'tiktok', event: string, parameters?: Record<string, any>): void {
  switch (platform) {
    case 'facebook':
      trackFacebookEvent(event, parameters);
      break;
    case 'google':
      trackGAEvent(event, parameters);
      break;
    case 'tiktok':
      trackTikTokEvent(event, parameters);
      break;
  }
}

// E-commerce event tracking
export function trackProductView(productId: string, productName: string, price: number, category: string): void {
  // Facebook
  trackFacebookViewContent(productId, price);
  
  // TikTok
  trackTikTokViewContent(productId, price);
  
  // Google Analytics
  trackGAEvent('view_item', {
    item_id: productId,
    item_name: productName,
    price,
    category,
  });
}

export function trackAddToCart(productId: string, productName: string, price: number, quantity: number = 1): void {
  // Facebook
  trackFacebookAddToCart(productId, price * quantity);
  
  // TikTok
  trackTikTokAddToCart(productId, price * quantity);
  
  // Google Analytics
  trackGAEvent('add_to_cart', {
    item_id: productId,
    item_name: productName,
    price,
    quantity,
  });
}

export function trackPurchase(orderId: string, value: number, currency: string = 'USD', items: Array<{id: string; name: string; price: number; quantity: number}>): void {
  // Facebook
  trackFacebookPurchase(value, currency);
  
  // TikTok
  trackTikTokCompletePayment(value, currency);
  
  // Google Analytics
  trackGAEvent('purchase', {
    transaction_id: orderId,
    value,
    currency,
    items,
  });
}

export function trackLead(leadId: string, leadType: 'reseller' | 'franchise'): void {
  // Facebook
  trackFacebookLead();
  
  // Google Analytics
  trackGAEvent('generate_lead', {
    lead_id: leadId,
    lead_type: leadType,
  });
}

export function trackRegistration(userId: string, method: 'email' | 'google' | 'github'): void {
  // Facebook
  trackFacebookCompleteRegistration();
  
  // Google Analytics
  trackGAEvent('sign_up', {
    user_id: userId,
    method,
  });
}

// Generate tracking scripts HTML
export function generateTrackingScripts(config: TrackingConfig): string {
  const scripts: string[] = [];

  if (config.facebookPixelId) {
    scripts.push(initFacebookPixel(config.facebookPixelId));
  }

  if (config.googleAdsId) {
    scripts.push(initGoogleAds(config.googleAdsId));
  }

  if (config.googleAnalyticsId) {
    scripts.push(initGoogleAnalytics(config.googleAnalyticsId));
  }

  if (config.tiktokPixelId) {
    scripts.push(initTikTokPixel(config.tiktokPixelId));
  }

  if (config.hotjarId) {
    scripts.push(initHotjar(config.hotjarId));
  }

  return scripts.map((script) => `<script>${script}</script>`).join('\n');
}

// No-JS fallback for tracking (images)
export function generateNoJSTrackingPixels(config: TrackingConfig): string {
  const pixels: string[] = [];

  if (config.facebookPixelId) {
    pixels.push(`<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=${config.facebookPixelId}&ev=PageView&noscript=1" />`);
  }

  return pixels.join('\n');
}

// Consent management (GDPR/CCPA)
export function updateTrackingConsent(consent: {
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
}): void {
  if (typeof window === 'undefined' || !window.gtag) return;
  
  window.gtag('consent', 'update', {
    analytics_storage: consent.analytics ? 'granted' : 'denied',
    ad_storage: consent.marketing ? 'granted' : 'denied',
    ad_user_data: consent.marketing ? 'granted' : 'denied',
    ad_personalization: consent.preferences ? 'granted' : 'denied',
  });
}

// Declare global types for tracking
declare global {
  interface Window {
    fbq?: any;
    gtag?: any;
    ttq?: any;
    dataLayer?: any[];
  }
}
