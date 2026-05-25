import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// `site` is the build-time canonical base for sitemap entries + canonical URLs.
// Today: still .web.app (staging). On cutover (mkY0iyEe) flip to https://msapps.mobi.
export default defineConfig({
  site: 'https://msapps-website-staging.web.app',
  output: 'static',
  i18n: {
    defaultLocale: 'he',
    locales: ['he', 'en'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
  build: {
    format: 'directory',
  },
  integrations: [
    sitemap({
      i18n: {
        defaultLocale: 'he',
        locales: { he: 'he-IL', en: 'en-US' },
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
