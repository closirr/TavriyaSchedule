import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Plugin to replace %BASE_URL% in HTML
function baseUrlPlugin(): Plugin {
  let base = '/';
  return {
    name: 'base-url-plugin',
    configResolved(config) {
      base = config.base;
    },
    transformIndexHtml(html) {
      return html.replace(/%BASE_URL%/g, base);
    },
  };
}

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
    plugins: [react(), baseUrlPlugin()],
    // Remove console.log in production
    esbuild: {
      drop: mode === 'production' ? ['console', 'debugger'] : [],
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "client", "src"),
        "@shared": path.resolve(__dirname, "shared"),
        "@assets": path.resolve(__dirname, "attached_assets"),
      },
    },
    root: path.resolve(__dirname, "client"),
    base: getBasePath(),
    build: {
    outDir: path.resolve(__dirname, "dist"),
    emptyOutDir: true,
    sourcemap: false, // Disable source maps for smaller build size
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
