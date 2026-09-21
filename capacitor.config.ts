import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'omiver.app',
  appName: 'omiver-app',
  webDir: 'dist',
  // Matches --bg in src/styles/tokens.css. Without this the native webview
  // shows its own background during load and behind overscroll, which reads
  // as a flash of the wrong colour.
  backgroundColor: '#f3f6f4',
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
  },
  android: {
    buildOptions: {
      keystorePath: '/Users/dexz/workspace/omiver/omiver-app/android/signoff.jks',
      keystoreAlias: 'key0',
      signingType: 'apksigner',
    },
  },
};

export default config;
