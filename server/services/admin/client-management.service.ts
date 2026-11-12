import { userRepository, type FindClientsParams } from '#server/repositories/prisma/user.repository'

export const clientManagementService = {
  /** Получение списка клиентов с поддержкой пагинации, поиска и фильтрации по адресу */

  async getClientsPaginated(query: FindClientsParams) {
    const page = Number(query.page) || 1
    const limit = Number(query.limit) || 20
    const search = query.search ? String(query.search).trim() : ''
    const addressId = query.addressId ? Number(query.addressId) : null

    // Вызываем метод репозитория вместо прямого обращения к prisma
    const { clients, total } = await userRepository.findClientsPaginated({
      page,
      limit,
      search,
      addressId
    })

    return {
      success: true,
      clients,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1
      }
    }
  }
}
