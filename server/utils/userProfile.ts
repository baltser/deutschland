import bcrypt from 'bcryptjs'

interface UpdateProfileParams {
  userId: number
  name?: string
  email?: string | null
  password?: string
}

export async function updateUserProfile({ userId, name, email, password }: UpdateProfileParams) {
  const updateData: {
    user_name?: string
    email?: string | null
    email_verified_at?: Date | null
    password?: string
  } = {}

  if (name !== undefined) {
    updateData.user_name = name
  }

  if (email !== undefined) {
    const cleanEmail = email ? email.trim() : null

    if (cleanEmail) {
      const existingUser = await prisma.users.findUnique({ where: { email: cleanEmail } })
      if (existingUser && existingUser.user_id !== userId) {
        throw createError({
          statusCode: 409,
          message: 'Этот email уже используется другим пользователем'
        })
      }
    }

    const currentUser = await prisma.users.findUnique({ where: { user_id: userId } })

    updateData.email = cleanEmail

    if (currentUser?.email !== cleanEmail) {
      updateData.email_verified_at = null
    }
  }

  if (password && password.trim() !== '') {
    updateData.password = await bcrypt.hash(password, 10)
  }

  const updatedUser = await prisma.users.update({
    where: { user_id: userId },
    data: updateData,
    include: { role: { select: { role_name: true } } }
  })

  return updatedUser
}
