import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ggms.wholesale',
  appName: 'GGM&S Wholesale',
  webDir: 'public',
  server: {
    url: 'https://ggms-wholesale-app.vercel.app',
    cleartext: true
  }
};

export default config;
