// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    'nuxt-auth-utils'
  ],

  devtools: {
    enabled: true
  },
  fonts: {
    // Отключаем скачивание или настраиваем поведение при отсутствии интернета в Docker
    provider: 'local', // или 'none', если шрифты не критичны при сборке
  },
  css: ['~/assets/css/main.css'],
  routeRules: {
    '/login': { redirect: '/auth/login' },
    '/register': { redirect: '/auth/register' }
  },
  // routeRules: {
  //   '/': { prerender: true }
  // },
  runtimeConfig: {
    session: {
      maxAge: 60 * 60 * 24 * 7,
      cookie: {
        secure: process.env.NODE_ENV === 'production' && process.env.NUXT_SESSION_SECURE === 'true' // false для HTTP
      }
    },
    minio: {
      endpoint: process.env.NUXT_MINIO_ENDPOINT || 'minio',
      port: Number(process.env.NUXT_MINIO_PORT) || 9000,
      useSSL: process.env.NUXT_MINIO_USE_SSL === 'true',
      accessKey: process.env.NUXT_MINIO_ACCESS_KEY || 'admin',
      secretKey: process.env.NUXT_MINIO_SECRET_KEY || 'password12345',
      bucket: process.env.NUXT_MINIO_BUCKET || 'dnz-uploads'
    }
  },

  compatibilityDate: '2026-06-30'

  // eslint: {
  //   config: {
  //     stylistic: {
  //       commaDangle: 'never',
  //       braceStyle: '1tbs'
  //     }
  //   }
  // }
})
