import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'omiver.app',
  appName: 'omiver-app',
  webDir: 'dist',
  // Matches --bg in src/styles/tokens.css. Without this the native webview
  // shows its own background during load and behind overscroll, which reads
  // as a flash of the wrong colour.
  backgroundColor: '#f3f6f4'
};

export default config;
