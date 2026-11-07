// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    'nuxt-auth-utils',
    '@pinia/nuxt'
  ],
  devtools: {
    enabled: true
  },
  fonts: {
    provider: 'local',
  },
  css: ['~/assets/css/main.css'],
  routeRules: {
    '/login': { redirect: '/auth/login' },
    '/register': { redirect: '/auth/register' }
  },
  runtimeConfig: {
    session: {
      cookie: {
        secure: process.env.NODE_ENV === 'production' && process.env.NUXT_SESSION_SECURE === 'true'
      }
    },
    redis: {
      host: process.env.REDIS_HOST || 'redis',
      port: Number(process.env.REDIS_PORT || 6379),
    },
    minio: {
      endpoint: process.env.NUXT_MINIO_ENDPOINT || 'minio',
      port: Number(process.env.NUXT_MINIO_PORT) || 9000,
      useSSL: process.env.NUXT_MINIO_USE_SSL === 'true',
      accessKey: process.env.NUXT_MINIO_ACCESS_KEY || 'admin',
      secretKey: process.env.NUXT_MINIO_SECRET_KEY || 'password12345',
      bucket: process.env.NUXT_MINIO_BUCKET || 'dnz-uploads'
    },
    smtp: {
      host: process.env.SMTP_HOST || 'smtp.mail.ru',
      port: Number(process.env.SMTP_PORT) || 465,
      secure: process.env.SMTP_SECURE === 'true',
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
      from: process.env.SMTP_FROM || process.env.SMTP_FROM_EMAIL || '"Двор на замок" <motokawasaki@mail.ru>',
    },
    public: {
      appUrl: process.env.NUXT_PUBLIC_APP_URL || 'http://localhost:3000'
    },
  },
  compatibilityDate: '2026-06-30'
})
