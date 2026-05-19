import { defineConfig, loadEnv, Plugin } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import { parseScheduleCSV } from './client/src/lib/csv-parser';
import { createScheduleApiIndex, createScheduleApiPayload } from './client/src/lib/schedule-api';

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

function scheduleApiPlugin(googleSheetsUrl?: string): Plugin {
  let outDir = '';

  return {
    name: 'schedule-api-plugin',
    apply: 'build',
    configResolved(config) {
      outDir = config.build.outDir;
    },
    async closeBundle() {
      const apiDir = path.resolve(outDir, 'api');
      await fs.mkdir(apiDir, { recursive: true });

      const generatedAt = new Date();
      const index = createScheduleApiIndex(generatedAt);
      await fs.writeFile(
        path.join(apiDir, 'index.json'),
        `${JSON.stringify(index, null, 2)}\n`,
        'utf8'
      );

      if (!googleSheetsUrl) {
        this.warn('VITE_GOOGLE_SHEETS_URL is not set; schedule API data files were not generated.');
        return;
      }

      const response = await fetch(googleSheetsUrl, {
        headers: {
          Accept: 'text/csv, text/plain, */*',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to generate schedule API: ${response.status} ${response.statusText}`);
      }

      const csv = await response.text();
      const parseResult = parseScheduleCSV(csv);
      const payload = createScheduleApiPayload({
        lessons: parseResult.lessons,
        metadata: parseResult.metadata,
        generatedAt,
        source: {
          type: 'google-sheets-csv',
          url: googleSheetsUrl,
        },
        parseErrors: parseResult.errors.length,
      });

      await fs.writeFile(
        path.join(apiDir, 'schedule.json'),
        `${JSON.stringify(payload, null, 2)}\n`,
        'utf8'
      );
      await fs.writeFile(
        path.join(apiDir, 'lessons.json'),
        `${JSON.stringify(payload.lessons, null, 2)}\n`,
        'utf8'
      );
    },
  };
}

// Static site configuration for Tavriya Schedule
// Google Sheets URL is configured via VITE_GOOGLE_SHEETS_URL environment variable
export default defineConfig(({ mode, command }) => {
  const env = loadEnv(mode, __dirname, 'VITE_');

  // Determine base path based on build target
  const getBasePath = () => {
    if (command === 'serve') return '/'; // Development
    // For production: use /schedule/ only if explicitly set, otherwise use /
    if (process.env.BUILD_TARGET === 'schedule') return '/schedule/'; // Main site build
    return '/'; // Render and other deployments (default)
  };

  return {
    plugins: [react(), baseUrlPlugin(), scheduleApiPlugin(env.VITE_GOOGLE_SHEETS_URL)],
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
    host: true, // Дозволяє доступ по мережі
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
