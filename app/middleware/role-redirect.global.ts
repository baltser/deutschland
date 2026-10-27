export default defineNuxtRouteMiddleware(async (to) => {
  const { loggedIn, user, fetch } = useUserSession()

  // 💡 Обязательно синхронизируем сессию с кукой при переходах
  await fetch()

  const protectedPaths = ['/admin', '/client', '/installer', '/profile']
  const isProtected = protectedPaths.some(path => to.path.startsWith(path))

  // 1. Если после фетча пользователь не залогинен
  if (!loggedIn.value || !user.value) {
    if (isProtected) {
      return navigateTo('/auth/login')
    }
    return
  }

  // 2. Безопасно получаем роль залогиненного пользователя
  const roleName = (user.value as { role_name?: string })?.role_name || ''

  // 👑 Админ имеет доступ везде
  if (roleName === 'admin') {
    return
  }

  // 3. Клиент может быть только в /client и /profile
  if (roleName === 'client') {
    if (!to.path.startsWith('/client') && !to.path.startsWith('/profile')) {
      return navigateTo('/client')
    }
    return
  }

  // 4. Монтажник может быть только в /installer и /profile
  if (roleName === 'installer') {
    if (!to.path.startsWith('/installer') && !to.path.startsWith('/profile')) {
      return navigateTo('/installer')
    }
    return
  }
})
