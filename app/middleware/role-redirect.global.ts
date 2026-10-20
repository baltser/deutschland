// app/middleware/role-redirect.global.ts
export default defineNuxtRouteMiddleware((to) => {
  const { loggedIn, user } = useUserSession()

  // Если пользователь не авторизован, не трогаем его
  if (!loggedIn.value || !user.value) {
    return
  }

  const roleName = (user.value as { role_name?: string })?.role_name || ''

  // 👑 Администратор имеет полный доступ ко всем страницам
  if (roleName === 'admin') {
    return
  }

  // 1. Если пользователь — клиент
  if (roleName === 'client') {
    if (to.path === '/' || to.path.startsWith('/admin') || to.path.startsWith('/installer')) {
      return navigateTo('/client')
    }
  }

  // 2. Если пользователь — монтажник
  if (roleName === 'installer') {
    // Если монтажник пытается зайти на главную, в клиентский кабинет или в админку
    if (to.path === '/' || to.path.startsWith('/client') || to.path.startsWith('/admin')) {
      return navigateTo('/installer')
    }
  }
})
