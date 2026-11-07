export interface CustomToastOptions {
  duration?: number
  icon?: string
}

export interface ToastObjectWithId {
  id: string | number
  [key: string]: unknown
}

export type ToastIdentifier = string | number | ToastObjectWithId

export const useToastNotifications = () => {
  const toast = useToast()

  const showSuccess = (title: string, description?: string, options?: CustomToastOptions) => {
    return toast.add({
      title,
      description,
      color: 'success',
      icon: options?.icon || 'i-lucide-check-circle',
      duration: options?.duration ?? 3000
    })
  }

  const showError = (title: string, description?: string, options?: CustomToastOptions) => {
    return toast.add({
      title,
      description,
      color: 'error',
      icon: options?.icon || 'i-lucide-alert-triangle',
      duration: options?.duration ?? 5000
    })
  }

  const showWarning = (title: string, description?: string, options?: CustomToastOptions) => {
    return toast.add({
      title,
      description,
      color: 'warning',
      icon: options?.icon || 'i-lucide-alert-circle',
      duration: options?.duration ?? 4000
    })
  }

  const showInfo = (title: string, description?: string, options?: CustomToastOptions) => {
    return toast.add({
      title,
      description,
      color: 'info',
      icon: options?.icon || 'i-lucide-info',
      duration: options?.duration ?? 3000
    })
  }

  const closeToast = (toastId: ToastIdentifier) => {
    if (toastId !== null && typeof toastId === 'object' && 'id' in toastId) {
      toast.remove(toastId.id)
    } else if (typeof toastId === 'string' || typeof toastId === 'number') {
      toast.remove(toastId)
    }
  }

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    closeToast
  }
}
