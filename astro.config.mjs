import { defineConfig } from 'astro/config';

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
});
