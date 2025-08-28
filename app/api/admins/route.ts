import { type NextRequest, NextResponse } from "next/server"
import { verifyToken, createAdmin, getAllAdmins } from "@/lib/auth"

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

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value
    if (!token) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    const payload = verifyToken(token)
    
    if (!payload || payload.role !== "super_admin") {
      return NextResponse.json({ success: false, error: "Super admin access required" }, { status: 403 })
    }

    const body = await request.json()
    const { username, email, password, role } = body

    if (!username || !email || !password) {
      return NextResponse.json(
        {
          success: false,
          error: "Username, email, and password are required",
        },
        { status: 400 },
      )
    }

    const newAdmin = await createAdmin(username, email, password, role || "ADMIN")

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
      { status: 201 },
    )
  } catch (error: any) {
    console.error("[v0] Error creating admin:", error)
    if (error.message.includes("already exists")) {
      return NextResponse.json({ success: false, error: error.message }, { status: 409 })
    }
    return NextResponse.json({ success: false, error: "Failed to create admin" }, { status: 500 })
  }
}
