export function useResendCooldown(cooldownSeconds = 60) {
  const cooldown = ref(0)
  let timer: NodeJS.Timeout | null = null

  function startTimer(seconds = cooldownSeconds) {
    cooldown.value = seconds
    if (timer) clearInterval(timer)

    timer = setInterval(() => {
      if (cooldown.value > 0) {
        cooldown.value--
      } else {
        if (timer) clearInterval(timer)
      }
    }, 1000)
  }

  return {
    cooldown,
    startTimer
  }
}
