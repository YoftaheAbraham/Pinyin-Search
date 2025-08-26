import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, password } = body

    console.log("[v0] Login attempt:", {
      username,
      timestamp: new Date().toISOString(),
      ip: request.ip || "unknown",
    })

    if (!username || !password) {
      console.log("[v0] Login failed: Missing credentials")
      return NextResponse.json({ success: false, error: "Username and password are required" }, { status: 400 })
    }

    const mockUsers = [
      { username: "admin", password: "admin123" },
      { username: "user", password: "user123" },
    ]

    const user = mockUsers.find((u) => u.username === username && u.password === password)

    if (user) {
      console.log("[v0] Login successful for user:", username)
      return NextResponse.json({
        success: true,
        message: "Login successful",
        user: {
          username: user.username,
          loginTime: new Date().toISOString(),
        },
      })
    } else {
      console.log("[v0] Login failed: Invalid credentials for user:", username)
      return NextResponse.json({ success: false, error: "Invalid username or password" }, { status: 401 })
    }
  } catch (error) {
    console.error("[v0] Login API error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
