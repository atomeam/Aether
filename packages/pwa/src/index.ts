/**
 * @aether/pwa - Progressive Web App utilities
 *
 * Service worker registration, manifest generation, offline support
 */

export interface PWAConfig {
  name: string;
  shortName: string;
  description?: string;
  themeColor?: string;
  backgroundColor?: string;
  display?: 'standalone' | 'fullscreen' | 'minimal-ui' | 'browser';
  orientation?: 'portrait' | 'landscape';
  startUrl?: string;
  icons?: {
    src: string;
    sizes: string;
    type: string;
  }[];
}

export function generateManifest(config: PWAConfig): string {
  const manifest = {
    name: config.name,
    short_name: config.shortName,
    description: config.description || '',
    theme_color: config.themeColor || '#000000',
    background_color: config.backgroundColor || '#ffffff',
    display: config.display || 'standalone',
    orientation: config.orientation || 'portrait',
    start_url: config.startUrl || '/',
    icons: config.icons || [],
  };

  return JSON.stringify(manifest, null, 2);
}

export function registerServiceWorker(swPath: string): void {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register(swPath)
        .then((registration) => {
          console.log('SW registered: ', registration);
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError);
        });
    });
  }
}

export function unregisterServiceWorker(): void {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
      })
      .catch((error) => {
        console.error(error.message);
      });
  }
}
