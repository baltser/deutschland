export default defineNuxtRouteMiddleware((to) => {
  const { loggedIn, user } = useUserSession()

  // Если пользователь не авторизован, не трогаем его (пускай работает auth-страница)
  if (!loggedIn.value || !user.value) {
    return
  }

  const roleName = (user.value as { role_name?: string })?.role_name || ''

  // 1. Если пользователь — клиент
  if (roleName === 'client') {
    // Если клиент пытается зайти на главную '/' или в админку '/admin/...', редиректим его на /client
    if (to.path === '/' || to.path.startsWith('/admin')) {
      return navigateTo('/client')
    }
  }

  // 2. Если пользователь — админ, менеджер или монтажник (сотрудник)
  if (['admin', 'manager', 'installer'].includes(roleName)) {
    // Если сотрудник пытается зайти в клиентский кабинет '/client', отправляем его в админку
    if (to.path.startsWith('/client')) {
      return navigateTo('/admin/addresses') // или на ваш основной экран админки
    }

    // Если сотрудник заходит на корень '/', тоже можно перенаправить в админку
    if (to.path === '/') {
      return navigateTo('/admin/addresses')
    }
  }
})
