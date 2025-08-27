import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"
import { Prisma } from "@/lib/prisma.client"

export async function DELETE(request: NextRequest) {
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
    const { ids } = body

    console.log("[API] Batch deleting dictionary entries:", ids?.length, "entries")

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { success: false, message: "IDs array is required and must not be empty" },
        { status: 400 },
      )
    }

    const numericIds = ids.map((id) => Number.parseInt(id)).filter((id) => !isNaN(id))

    if (numericIds.length === 0) {
      return NextResponse.json({ success: false, message: "Valid numeric IDs are required" }, { status: 400 })
    }

    const deleteResult = await Prisma.dictionary.deleteMany({
      where: {
        id: {
          in: numericIds,
        },
      },
    })

    console.log("[API] Batch deletion completed:", deleteResult.count, "entries deleted")

    return NextResponse.json({
      success: true,
      data: {
        deletedCount: deleteResult.count,
        requestedIds: numericIds,
      },
      message: `Successfully deleted ${deleteResult.count} dictionary entries`,
    })
  } catch (error) {
    console.error("[API] Error in batch word deletion:", error)
    return NextResponse.json({ success: false, message: "Failed to delete dictionary entries" }, { status: 500 })
  }
}
