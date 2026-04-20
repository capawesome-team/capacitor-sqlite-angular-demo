import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.capawesome.capacitorsqlitedemo',
  appName: 'Capacitor SQLite Demo',
  webDir: 'www',
  plugins: {
    Keyboard: {
      resize: 'none',
    },
  },
};

export default config;
