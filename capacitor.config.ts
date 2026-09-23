import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'buzz.com',  // badilisha - lazima iwe unique, reverse-domain style
  appName: 'wizz.app',            // jina la app yako halisi
  webDir: '.output/public',
  server: {
    url: 'https://buzz-discover-pulse-eic4.vercel.app/', // production deployment (public, auto-deploys from main)
    cleartext: false,
  },
};

export default config;