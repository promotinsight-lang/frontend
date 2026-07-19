export const GA_MEASUREMENT_ID =
  import.meta.env.VITE_GA_MEASUREMENT_ID || 'G-2PWNN8D83W';

let isAnalyticsInitialized = false;
let lastTrackedPath = '';

export const initAnalytics = () => {
  if (!GA_MEASUREMENT_ID || typeof window === 'undefined') return;

  window.dataLayer = window.dataLayer || [];
  window.gtag =
    window.gtag ||
    function gtag() {
      window.dataLayer.push(arguments);
    };

  const scriptSrc = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  if (!document.querySelector(`script[src="${scriptSrc}"]`)) {
    const script = document.createElement('script');
    script.async = true;
    script.src = scriptSrc;
    document.head.appendChild(script);
  }

  if (!isAnalyticsInitialized) {
    window.gtag('js', new Date());
    window.gtag('config', GA_MEASUREMENT_ID, { send_page_view: false });
    isAnalyticsInitialized = true;
  }
};

export const trackPageView = (pagePath) => {
  if (!GA_MEASUREMENT_ID || typeof window === 'undefined') return;
  if (pagePath === lastTrackedPath) return;

  initAnalytics();
  lastTrackedPath = pagePath;

  window.gtag('event', 'page_view', {
    page_path: pagePath,
    page_location: window.location.href,
    page_title: document.title,
  });
};
