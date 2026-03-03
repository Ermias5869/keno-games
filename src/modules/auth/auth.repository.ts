import { prisma } from "@/lib/db/prisma";

/** Auth repository — database operations for users */
export const authRepository = {
  /** Find a user by phone number */
  async findByPhone(phone: string) {
    return prisma.user.findUnique({
      where: { phone },
      select: {
        id: true,
        phone: true,
        password: true,
        balance: true,
        role: true,
        createdAt: true,
      },
    });
  },

  /** Find a user by ID */
  async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        phone: true,
        balance: true,
        role: true,
        createdAt: true,
      },
    });
  },

  /** Create a new user */
  async createUser(data: { phone: string; password: string }) {
    return prisma.user.create({
      data: {
        phone: data.phone,
        password: data.password,
      },
      select: {
        id: true,
        phone: true,
        balance: true,
        role: true,
        createdAt: true,
      },
    });
  },
};
