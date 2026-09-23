import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'buzz.com',  // badilisha - lazima iwe unique, reverse-domain style
  appName: 'wizz.app',            // jina la app yako halisi
  webDir: '.output/public',
  server: {
    url: 'https://buzz-discover-pulse-juz7.vercel.app/',  // link halisi ya app yako iliyo-deployed
    cleartext: false,
  },
};

export default config;