import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// Static site configuration for Tavriya Schedule
// Google Sheets URL is configured via VITE_GOOGLE_SHEETS_URL environment variable
export default defineConfig(({ mode, command }) => {
  // Determine base path based on build target
  const getBasePath = () => {
    if (command === 'serve') return '/'; // Development
    if (process.env.BUILD_TARGET === 'render') return '/'; // Render build
    return '/schedule/'; // Main site build (default production)
  };

  return {
    plugins: [react()],
    // Remove console.log in production
    esbuild: {
      drop: mode === 'production' ? ['console', 'debugger'] : [],
    },
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "client", "src"),
        "@shared": path.resolve(import.meta.dirname, "shared"),
        "@assets": path.resolve(import.meta.dirname, "attached_assets"),
      },
    },
    root: path.resolve(import.meta.dirname, "client"),
    base: getBasePath(),
    build: {
    outDir: path.resolve(import.meta.dirname, "dist"),
    emptyOutDir: true,
    sourcemap: true,
    // Optimize for static hosting
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'ui-vendor': ['@radix-ui/react-select', '@radix-ui/react-dialog', '@radix-ui/react-tabs'],
        },
      },
    },
  },
  server: {
    port: 5173,
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
  preview: {
    port: 4173,
  },
    // Environment variables - VITE_GOOGLE_SHEETS_URL is automatically available
    // via import.meta.env.VITE_GOOGLE_SHEETS_URL in client code
    envPrefix: 'VITE_',
  };
});
