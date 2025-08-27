import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { Prisma } from "./prisma.client"

const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-production"

export interface AdminUser {
  id: number
  username: string
  email: string
  role: string
  isActive: boolean
  createdAt: Date
}

export interface JWTPayload {
  adminId: number
  username: string
  role: string
  iat?: number
  exp?: number
}

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12
  return await bcrypt.hash(password, saltRounds)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword)
}

export async function createAdmin(
  username: string,
  email: string,
  password: string,
  role = "admin",
): Promise<AdminUser | null> {
  try {
    const hashedPassword = await hashPassword(password)

    const admin = await Prisma.admin.create({
      data: {
        username,
        email,
        password: hashedPassword,
        role,
        isActive: true,
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true
      },
    })

    return admin
  } catch (error) {
    console.error("Error creating admin:", error)
    return null
  }
}

export async function authenticateAdmin(
  username: string,
  password: string,
): Promise<{ admin: AdminUser; token: string } | null> {
  try {
    const admin = await Prisma.admin.findFirst({
      where: {
        OR: [{ username }, { email: username }],
        isActive: true,
      },
    })

    if (!admin) {
      return null
    }

    const isValidPassword = await verifyPassword(password, admin.password)
    if (!isValidPassword) {
      return null
    }

    const token = generateToken(admin.id, admin.username, admin.role)

    return {
      admin: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
        isActive: admin.isActive,
        createdAt: admin.createdAt
      },
      token,
    }
  } catch (error) {
    console.error("Error authenticating admin:", error)
    return null
  }
}

export async function getAllAdmins(): Promise<AdminUser[]> {
  try {
    const admins = await Prisma.admin.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true
      },
      orderBy: {
        createdAt: "desc",
      },
    })
    console.log(admins);
    return admins
  } catch (error) {
    
    console.error("Error fetching admins:", error)
    return []
  }
}

export async function updateAdminStatus(id: number, isActive: boolean): Promise<boolean> {
  try {
    await Prisma.admin.update({
      where: { id },
      data: { isActive },
    })
    return true
  } catch (error) {
    console.error("Error updating admin status:", error)
    return false
  }
}

export function generateToken(adminId: number, username: string, role: string): string {
  return jwt.sign(
    {
      adminId,
      username,
      role,
    },
    JWT_SECRET,
    {
      expiresIn: "24h",
    },
  )
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload
    return decoded
  } catch (error) {
    console.error("Token verification failed:", error)
    return null
  }
}
