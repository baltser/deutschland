import bcrypt from 'bcryptjs'

interface UpdateProfileParams {
  userId: number
  name?: string
  password?: string
}

export async function updateUserProfile({ userId, name, password }: UpdateProfileParams) {
  const updateData: {
    user_name?: string
    password?: string
  } = {}

  if (name !== undefined) {
    updateData.user_name = name.trim()
  }

  if (password && password.trim() !== '') {
    updateData.password = await bcrypt.hash(password, 10)
  }

  return await prisma.users.update({
    where: { user_id: userId },
    data: updateData,
    include: { role: { select: { role_name: true } } }
  })
}
