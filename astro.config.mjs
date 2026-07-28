// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  // Required for the sitemap and for absolute OG/canonical URLs.
  site: 'https://latchpoint.co',
  integrations: [sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
});
