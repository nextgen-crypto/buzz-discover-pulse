import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
    spa: {
      enabled: true,
      prerender: {
        crawlLinks: true,
        outputPath: "index.html",
      },
    },
  },
  tailwindcss: {
    optimize: false,
  },
});