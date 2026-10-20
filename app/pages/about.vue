<script setup lang="ts">
const { loggedIn } = useUserSession()

useSeoMeta({
  title: 'О компании',
  description: '«Двор на замок» — более 11 лет опыта в сфере систем безопасности, видеонаблюдения и контроля доступа.',
})
</script>

<template>
  <div class="space-y-16 py-8">
    <!-- 1. Hero Секция (Главный экран) -->
    <section class="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
      <div class="space-y-6">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 text-xs font-semibold uppercase tracking-wider">
          <UIcon name="i-lucide-shield-check" class="w-4 h-4" />
          Надежность с 2015 года
        </div>
        <h1 class="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-neutral-900 dark:text-white leading-tight">
          Безопасность и комфорт вашего дома под надежной защитой
        </h1>
        <p class="text-base text-neutral-600 dark:text-neutral-400 leading-relaxed">
          Компания <strong class="text-neutral-900 dark:text-white">«Двор на замок»</strong> выросла из регионального эксперта в надежного поставщика комплексных систем безопасности. Более 11 лет мы создаем безопасное пространство для жилых комплексов, частных домов и бизнес-объектов.
        </p>
        <div class="flex flex-wrap gap-3">
          <UButton to="/services" color="primary" size="lg" icon="i-lucide-briefcase">
            Наши услуги
          </UButton>
          <UButton v-if="!loggedIn" to="/login" variant="outline" color="neutral" size="lg" icon="i-lucide-arrow-right">
            Войти в систему
          </UButton>
        </div>
      </div>

      <!-- Картинка для Hero секции -->
      <div class="relative rounded-2xl overflow-hidden shadow-xl border border-neutral-200 dark:border-neutral-800 aspect-video lg:aspect-4/3">
        <img
          src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQQ3fYe_plibIe3TUQRRL8gmzr3q0Nt5yUcGigx0xOxhA&s=10"
          alt="Системы безопасности и видеонаблюдение"
          class="w-full h-full object-cover"
        >
        <div class="absolute inset-0 bg-gradient-to-t from-neutral-950/60 via-transparent to-transparent flex items-end p-6">
          <div class="text-white">
            <p class="text-sm font-medium">Современные технологии контроля доступа</p>
            <p class="text-xs text-neutral-300">IP-камеры, вызывные панели и умные домофоны</p>
          </div>
        </div>
      </div>
    </section>

    <!-- 2. Цифры и достижения -->
    <section class="grid grid-cols-2 md:grid-cols-4 gap-4 py-8 border-y border-neutral-200 dark:border-neutral-800">
      <div class="text-center space-y-1 p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900/50">
        <p class="text-3xl sm:text-4xl font-extrabold text-primary">11+</p>
        <p class="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">Лет на рынке</p>
      </div>
      <div class="text-center space-y-1 p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900/50">
        <p class="text-3xl sm:text-4xl font-extrabold text-primary">1000+</p>
        <p class="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">Установленных объектов</p>
      </div>
      <div class="text-center space-y-1 p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900/50">
        <p class="text-3xl sm:text-4xl font-extrabold text-primary">24/7</p>
        <p class="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">Поддержка и контроль</p>
      </div>
      <div class="text-center space-y-1 p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900/50">
        <p class="text-3xl sm:text-4xl font-extrabold text-primary">100%</p>
        <p class="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">Гарантия качества</p>
      </div>
    </section>

    <!-- 3. Наши ценности и подходы -->
    <section class="space-y-8">
      <div class="text-center max-w-2xl mx-auto space-y-2">
        <h2 class="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white">Почему выбирают нас</h2>
        <p class="text-sm text-neutral-500 dark:text-neutral-400">
          Мы не просто устанавливаем оборудование, мы выстраиваем экосистему безопасности под ключ.
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- Карточка 1 -->
        <div class="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 space-y-4 shadow-xs">
          <div class="w-12 h-12 rounded-xl bg-primary-50 dark:bg-primary-950/60 text-primary flex items-center justify-center">
            <!-- Исправлено: cpu -->
            <UIcon name="i-lucide-cpu" class="w-6 h-6" />
          </div>
          <h3 class="font-semibold text-lg text-neutral-900 dark:text-white">Современные технологии</h3>
          <p class="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
            Используем передовое железо и программное обеспечение: интеграция Flash Call авторизации, умный мониторинг IP-камер и вызывных панелей в реальном времени.
          </p>
        </div>

        <!-- Карточка 2 -->
        <div class="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 space-y-4 shadow-xs">
          <div class="w-12 h-12 rounded-xl bg-primary-50 dark:bg-primary-950/60 text-primary flex items-center justify-center">
            <!-- Исправлено: wrench -->
            <UIcon name="i-lucide-wrench" class="w-6 h-6" />
          </div>
          <h3 class="font-semibold text-lg text-neutral-900 dark:text-white">Профессиональный монтаж</h3>
          <p class="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
            Наши квалифицированные инженеры и монтажники выполняют работы любой сложности строго по стандартам безопасности и сетевой архитектуры.
          </p>
        </div>

        <!-- Карточка 3 -->
        <div class="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 space-y-4 shadow-xs">
          <div class="w-12 h-12 rounded-xl bg-primary-50 dark:bg-primary-950/60 text-primary flex items-center justify-center">
            <!-- Исправлено: users -->
            <UIcon name="i-lucide-users" class="w-6 h-6" />
          </div>
          <h3 class="font-semibold text-lg text-neutral-900 dark:text-white">Клиентоориентированность</h3>
          <p class="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
            Удобные личные кабинеты для клиентов, прозрачное управление объектами, адресами и быстрая техническая поддержка на всех этапах сотрудничества.
          </p>
        </div>
      </div>
    </section>
    <!-- 4. Дополнительный визуальный блок / Фотогалерея (с примерами ссылок) -->
    <section class="space-y-6 pt-6">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 class="text-xl font-bold text-neutral-900 dark:text-white">Наша работа «в поле»</h2>
          <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-1">Примеры монтажа и настройки оборудования на объектах</p>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-800 aspect-video group relative">
          <img
            src="https://avatars.mds.yandex.net/get-altay/15074774/2a00000195858cae0efbd92e82001fa08be0/L_height"
            alt="Монтаж оборудования"
            class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          >
          <div class="absolute inset-0 bg-neutral-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-4 text-center text-white text-xs font-medium">
            Настройка сетевого оборудования и коммутации
          </div>
        </div>

        <div class="rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-800 aspect-video group relative">
          <img
            src="https://dnz-russia.ru/files/Image/service/ipvideo.jpg"
            alt="Камеры и серверы"
            class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          >
          <div class="absolute inset-0 bg-neutral-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-4 text-center text-white text-xs font-medium">
            Установка систем видеонаблюдения высокого разрешения
          </div>
        </div>

        <div class="rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-800 aspect-video group relative">
          <img
            src="https://dnz-russia.ru/pics/ustanovka_domofona.png"
            alt="Инженерный контроль"
            class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          >
          <div class="absolute inset-0 bg-neutral-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-4 text-center text-white text-xs font-medium">
            Интеграция вызывных панелей и контроля доступа
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
