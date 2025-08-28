import { type NextRequest, NextResponse } from "next/server"
import { verifyToken, createAdmin, getAllAdmins } from "@/lib/auth"
import { findAdminByEmail, findAdminByUsername } from "@/lib/admin"

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value
    if (!token) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    const payload = verifyToken(token)
    console.log(payload);
    
    if (!payload || payload.role !== "super_admin") {
      return NextResponse.json({ success: false, error: "Super admin access required" }, { status: 403 })
    }

    const admins = await getAllAdmins()
    return NextResponse.json({
      success: true,
      data: admins,
      count: admins.length,
    })
  } catch (error) {
    console.error("[v0] Error fetching admins:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch admins" }, { status: 500 })
  }
}

// Email regex (basic but practical)
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Allowed roles
const ALLOWED_ROLES = ["ADMIN", "MODERATOR", "SUPER_ADMIN"]

export async function POST(request: NextRequest) {
  try {
    // 🔐 Auth check
    const token = request.cookies.get("auth-token")?.value
    if (!token) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload || payload.role !== "super_admin") {
      return NextResponse.json({ success: false, error: "Super admin access required" }, { status: 403 })
    }

    // 📥 Request body
    const body = await request.json()
    const { username, email, password, role } = body

    // ✅ Required fields
    if (!username || !email || !password) {
      return NextResponse.json(
        { success: false, error: "Username, email, and password are required" },
        { status: 400 }
      )
    }

    // 📧 Email validation
    if (!emailRegex.test(email)) {
      return NextResponse.json({ success: false, error: "Invalid email format" }, { status: 400 })
    }

    // 🔎 Duplicate check
    const existingEmail = await findAdminByEmail(email.toLowerCase())
    if (existingEmail) {
      return NextResponse.json({ success: false, error: "Email already exists" }, { status: 409 })
    }

    const existingUsername = await findAdminByUsername(username.toLowerCase())
    if (existingUsername) {
      return NextResponse.json({ success: false, error: "Username already exists" }, { status: 409 })
    }

    // 🎭 Role validation
    const normalizedRole = (role || "ADMIN").toUpperCase()
    if (!ALLOWED_ROLES.includes(normalizedRole)) {
      return NextResponse.json({ success: false, error: "Invalid role" }, { status: 400 })
    }

    // 🆕 Create new admin
    const newAdmin = await createAdmin(username.toLowerCase(), email.toLowerCase(), password, normalizedRole)

    return NextResponse.json(
      {
        success: true,
        data: {
          id: newAdmin?.id,
          username: newAdmin?.username,
          email: newAdmin?.email,
          role: newAdmin?.role,
          isActive: newAdmin?.isActive,
          createdAt: newAdmin?.createdAt,
        },
        message: "Admin created successfully",
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error("[v0] Error creating admin:", error)

    return NextResponse.json({ success: false, error: "Failed to create admin" }, { status: 500 })
  }
}
