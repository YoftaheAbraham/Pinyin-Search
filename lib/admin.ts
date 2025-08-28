import { Prisma } from "./prisma.client"

export async function findAdminByEmail(email: string) {
  return Prisma.admin.findUnique({ where: { email } })
}

export async function findAdminByUsername(username: string) {
  return Prisma.admin.findUnique({ where: { username } })
}
