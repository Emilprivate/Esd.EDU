import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
    open: true,
  },
  build: {
    minify: "terser",
    sourcemap: false,
    cssMinify: true,
  },
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "@mui/material",
      "socket.io-client",
      "leaflet",
    ],
  },
});
