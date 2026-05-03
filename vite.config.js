import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// IMPORTANT: change `base` to match your GitHub repo name
// Example: if your repo URL is https://github.com/robert/lemone-blog-studio
// then base should be '/lemone-blog-studio/'
export default defineConfig({
  plugins: [react()],
  base: '/lemone-blog-studio/'
});
