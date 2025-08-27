import { type NextRequest, NextResponse } from "next/server"
import { authenticateAdmin } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, password } = body

    console.log("[v0] Login attempt:", {
      username,
      timestamp: new Date().toISOString(),
      ip: (request as any).ip || "unknown",
    })

    if (!username || !password) {
      console.log("[v0] Login failed: Missing credentials")
      return NextResponse.json({ success: false, error: "Username and password are required" }, { status: 400 })
    }

    const result = await authenticateAdmin(username, password)

    if (result) {
      const { admin, token } = result
      console.log("[v0] Login successful for admin:", username)

      const response = NextResponse.json({
        success: true,
        message: "Login successful",
        user: {
          id: admin.id,
          username: admin.username,
          email: admin.email,
          role: admin.role,
          loginTime: new Date().toISOString(),
        },
      })

      // Set HTTP-only cookie for session management
      response.cookies.set("auth-token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      })

      return response
    } else {
      console.log("[v0] Login failed: Invalid credentials for user:", username)
      return NextResponse.json({ success: false, error: "Invalid username or password" }, { status: 401 })
    }
  } catch (error) {
    console.error("[v0] Login API error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
