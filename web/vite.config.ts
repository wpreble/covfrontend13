import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vueDevTools from "vite-plugin-vue-devtools";

export default defineConfig({
  plugins: [vue(), vueDevTools()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    host: "0.0.0.0",
    port: 5000,
    allowedHosts: true,
    proxy: {
      "/agents": "http://localhost:3000",
      "/solana": "http://localhost:3000",
      "/auth": "http://localhost:3000",
      "/user": "http://localhost:3000",
      "/protected": "http://localhost:3000",
    },
  },
});
