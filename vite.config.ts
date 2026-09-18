import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
  plugins: [react()],
  server: {
    // Polling also detects edits when native filesystem events are missed.
    watch: { usePolling: true, interval: 300 },
  },
});
