import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'fs';

// IMPORTANT: change `base` to match your GitHub repo name
// Example: if your repo URL is https://github.com/robert/lemone-blog-studio
// then base should be '/lemone-blog-studio/'

// v4.14: znacznik builda + version.json; aplikacja porównuje je i pokazuje pasek "Dostępna nowa wersja"
const BUILD_ID = new Date().toISOString();
const versionSrc = readFileSync(new URL('./src/version.js', import.meta.url), 'utf8');
const pick = (name) => (versionSrc.match(new RegExp(`${name} = "([^"]*)"`)) || [])[1] || '';

function versionFile() {
  return {
    name: 'lemone-version-file',
    apply: 'build',
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'version.json',
        source: JSON.stringify({ build: BUILD_ID, version: pick('APP_VERSION'), note: pick('APP_VERSION_NOTE') }),
      });
    },
  };
}

export default defineConfig(({ command }) => ({
  plugins: [react(), versionFile()],
  // Ścieżka bazowa: '/' dla Firebase Hosting (lmm-writer-8feb.web.app); GitHub Pages ustawia BASE_PATH=/lemone-blog-studio/
  base: process.env.BASE_PATH || '/',
  define: { __BUILD_ID__: JSON.stringify(command === 'build' ? BUILD_ID : 'dev') },
}));
