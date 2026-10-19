import { formatPhone } from '~/utils/formatPhone'

export function useAddressClients(addressId: string | number, onRefresh: () => Promise<void>) {
  const toast = useToast()

  const clientPhone = ref('')
  const clientName = ref('')
  const isAddingClient = ref(false)

  const handlePhoneInput = (val: string) => {
    clientPhone.value = formatPhone(val)
  }

  async function handleAddClient() {
    if (!clientPhone.value.trim()) return

    isAddingClient.value = true
    try {
      await $fetch(`/api/admin/addresses/${addressId}/clients`, {
        method: 'POST',
        body: {
          phone: clientPhone.value.trim(),
          user_name: clientName.value.trim() || undefined
        }
      })

      clientPhone.value = ''
      clientName.value = ''
      await onRefresh()

      toast.add({
        title: 'Успешно',
        description: 'Клиент успешно привязан к объекту',
        color: 'success'
      })
    } catch (err: unknown) {
      const fetchErr = err as { data?: { message?: string } }
      toast.add({
        title: 'Ошибка',
        description: fetchErr.data?.message || 'Не удалось привязать клиента',
        color: 'error'
      })
    } finally {
      isAddingClient.value = false
    }
  }

  return {
    clientPhone,
    clientName,
    isAddingClient,
    handlePhoneInput,
    handleAddClient
  }
}
