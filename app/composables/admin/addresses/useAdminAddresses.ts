import { useAdminAddressesStore } from '~/stores/adminAddresses.ts'

export function useAdminAddresses() {
  const store = useAdminAddressesStore()

  const newAddressText = ref('')
  const isSubmitting = ref(false)

  // Функция добавления с очисткой поля ввода
  async function handleAddAddress() {
    if (!newAddressText.value.trim()) return

    isSubmitting.value = true
    const success = await store.createAddress(newAddressText.value)
    if (success) {
      newAddressText.value = ''
    }
    isSubmitting.value = false
  }

  // Автоматически загружаем адреса при первом вызове, если список пуст
  if (store.addresses.length === 0 && !store.loading) {
    store.fetchAddresses()
  }

  return {
    addresses: computed(() => store.addresses),
    pending: computed(() => store.loading),
    error: computed(() => store.error),
    newAddressText,
    isSubmitting,
    handleAddAddress,
    refreshAddresses: store.fetchAddresses
  }
}
