import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'ScanManager',
  webDir: 'dist',

  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#ffffff",
      androidSplashResourceName: "splash",
      iosSplashResourceName: "splash",
      showSpinner: false,
      launchAutoHide: true,
    }
  }
};

export default config;
