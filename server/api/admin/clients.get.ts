import { clientManagementService } from '#server/services/admin/client-management.service.ts'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  return await clientManagementService.getClientsPaginated(query)
})
