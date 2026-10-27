import { useAdminAddressesStore } from '~/stores/admin/addresses'

export function useAdminAddressDetails() {
  const route = useRoute()
  const store = useAdminAddressesStore()

  const addressId = computed(() => {
    const id = route.params.id
    return (Array.isArray(id) ? id[0] : id) || ''
  })

  // Форма добавления клиента
  const clientPhone = ref('')
  const clientName = ref('')
  const isAddingClient = ref(false)

  // Загружаем данные при монтировании/изменении ID
  onMounted(() => {
    if (addressId.value) {
      store.fetchAddressById(addressId.value)
    }
  })

  async function handleAddClient() {
    if (!clientPhone.value || clientPhone.value.length < 10) return

    isAddingClient.value = true
    try {
      await store.addClientToAddress(addressId.value, {
        phone: clientPhone.value,
        user_name: clientName.value.trim() || undefined
      })
      // Очищаем форму
      clientPhone.value = ''
      clientName.value = ''
    } catch (err) {
      console.error('Ошибка привязки клиента:', err)
    } finally {
      isAddingClient.value = false
    }
  }

  function refresh() {
    if (addressId.value) {
      store.fetchAddressById(addressId.value)
    }
  }

  return {
    store,
    addressId,
    address: computed(() => store.currentAddress),
    pending: computed(() => store.loading),
    error: computed(() => store.error),
    clientPhone,
    clientName,
    isAddingClient,
    handleAddClient,
    refresh
  }
}
