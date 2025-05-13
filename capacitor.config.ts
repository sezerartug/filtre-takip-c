
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.2a8ff68db0c84a6bbf64ffffaaf4de9b',
  appName: 'Filtre Takip',
  webDir: 'dist',
  server: {
    url: 'https://2a8ff68d-b0c8-4a6b-bf64-ffffaaf4de9b.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#ffffff",
      showSpinner: true,
      androidSpinnerStyle: "large",
      spinnerColor: "#6366f1",
    }
  }
};

export default config;
