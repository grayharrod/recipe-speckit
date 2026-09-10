import { defineConfig } from "vitest/config";
import vue from "@vitejs/plugin-vue";
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      vue: fileURLToPath(new URL("./node_modules/vue", import.meta.url)),
      "/oc_logo.png": fileURLToPath(
        new URL("./public/oc_logo.png", import.meta.url)
      ),
    },
    dedupe: ["vue"],
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.js"],
    server: {
      deps: {
        inline: ["vuetify"],
      },
    },
  },
});
