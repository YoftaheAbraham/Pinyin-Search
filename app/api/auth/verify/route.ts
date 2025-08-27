import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value

    if (!token) {
      return NextResponse.json({ success: false, error: "No token provided" }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 })
    }

    return NextResponse.json({
      success: true,
      user: {
        id: payload.adminId,
        username: payload.username,
        role: payload.role,
      },
    })
  } catch (error) {
    console.error("[v0] Token verification error:", error)
    return NextResponse.json({ success: false, error: "Token verification failed" }, { status: 401 })
  }
}
