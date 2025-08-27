import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"
import { Prisma } from "@/lib/prisma.client"

export async function PATCH(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value
    if (!token) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ success: false, error: "Invalid authentication" }, { status: 401 })
    }

    const body = await request.json()
    const { ids, status } = body

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { success: false, message: "IDs array is required and must not be empty" },
        { status: 400 },
      )
    }

    if (!status || !["NOT_REVIEWED", "APPROVED", "REJECTED"].includes(status)) {
      return NextResponse.json(
        { success: false, message: "Valid status is required (NOT_REVIEWED, APPROVED, REJECTED)" },
        { status: 400 },
      )
    }

    const numericIds = ids.map((id) => Number.parseInt(id)).filter((id) => !isNaN(id))

    const updateResult = await Prisma.dictionary.updateMany({
      where: {
        id: {
          in: numericIds,
        },
      },
      data: {
        status,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        updatedCount: updateResult.count,
        status,
        ids: numericIds,
      },
      message: `Successfully updated ${updateResult.count} entries to ${status}`,
    })
  } catch (error) {
    console.error("[API] Error updating word status:", error)
    return NextResponse.json({ success: false, message: "Failed to update word status" }, { status: 500 })
  }
}
