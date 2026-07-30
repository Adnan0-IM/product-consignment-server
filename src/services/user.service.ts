import { prisma } from '../config/prisma.js'
import { NotFoundError, BadRequestError } from '../utils/errors.js'
import { Role, UserStatus } from '@prisma/client'

export class UserService {
  static async getUsers(query: {
    role?: Role
    status?: UserStatus
    search?: string
    page?: number
    limit?: number
  }) {
    const page = Number(query.page) || 1
    const limit = Number(query.limit) || 10
    const skip = (page - 1) * limit

    const where: any = {}

    if (query.role) where.role = query.role
    if (query.status) where.status = query.status

    if (query.search) {
      where.OR = [
        { firstName: { contains: query.search, mode: 'insensitive' } },
        { lastName: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
        { phone: { contains: query.search, mode: 'insensitive' } },
      ]
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          role: true,
          status: true,
          isVerified: true,
          createdAt: true,
          profile: true,
        },
      }),
      prisma.user.count({ where }),
    ])

    return {
      users,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  static async getUserById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
        profile: true,
        _count: {
          select: {
            products: true,
            consignmentsSent: true,
            consignmentsReceived: true,
            sales: true,
          },
        },
      },
    })

    if (!user) {
      throw new NotFoundError('User not found')
    }

    return user
  }

  static async updateUserStatus(id: string, status: UserStatus) {
    const user = await prisma.user.findUnique({ where: { id } })
    if (!user) {
      throw new NotFoundError('User not found')
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { status },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        status: true,
      },
    })

    return updatedUser
  }

  static async updateUserRole(id: string, role: Role) {
    const user = await prisma.user.findUnique({ where: { id } })
    if (!user) {
      throw new NotFoundError('User not found')
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        status: true,
      },
    })

    return updatedUser
  }

  static async deleteUser(id: string) {
    const user = await prisma.user.findUnique({ where: { id } })
    if (!user) {
      throw new NotFoundError('User not found')
    }

    await prisma.user.delete({ where: { id } })
    return { message: 'User deleted successfully' }
  }
}
