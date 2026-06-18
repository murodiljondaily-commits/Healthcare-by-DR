import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Target widely-supported JS so the bundle runs on older browsers too.
  // Fixes "Invalid regular expression flags" on browsers that don't support
  // the newest regex/JS syntax Vite would otherwise emit.
  build: {
    target: ["es2019", "chrome87", "firefox78", "safari14", "edge88"],
    cssTarget: ["chrome87", "firefox78", "safari14", "edge88"],
  },
  esbuild: {
    target: "es2019",
  },
  server: {
    host: "0.0.0.0",
    port: 3000,
  },
  preview: {
    host: "0.0.0.0",
    port: 3000,
  },
});
