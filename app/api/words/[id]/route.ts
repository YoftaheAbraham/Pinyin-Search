import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"
import { Prisma } from "@/lib/prisma.client"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = request.cookies.get("auth-token")?.value
    if (!token) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ success: false, error: "Invalid authentication" }, { status: 401 })
    }

    const id = Number.parseInt(params.id)
    const body = await request.json()
    const { chinese, english, pinyin, phonetic, status } = body

    console.log("[API] Updating dictionary entry ID:", id, "with data:", { chinese, english, pinyin, phonetic, status })

    if (!chinese || !english || !pinyin || !phonetic) {
      return NextResponse.json(
        { success: false, message: "Chinese, English, Pinyin, and Phonetic are required" },
        { status: 400 },
      )
    }

    const existingEntry = await Prisma.dictionary.findFirst({
      where: {
        AND: [
          { id: { not: id } },
          {
            OR: [{ chinese: { equals: chinese } }, { english: { equals: english } }],
          },
        ],
      },
    })

    if (existingEntry) {
      return NextResponse.json(
        { success: false, message: "Another entry with this Chinese or English word already exists" },
        { status: 409 },
      )
    }

    const updatedEntry = await Prisma.dictionary.update({
      where: { id },
      data: {
        chinese: chinese.trim(),
        english: english.trim(),
        pinyin: pinyin.trim(),
        phonetic: phonetic.trim(),
        ...(status && { status }),
        updatedAt: new Date(),
      },
    })

    console.log("[API] Successfully updated entry ID:", id)

    return NextResponse.json({
      success: true,
      data: updatedEntry,
      message: "Dictionary entry updated successfully",
    })
  } catch (error: any) {
    console.error("[API] Error updating word entry:", error)
    if (error.code === "P2025") {
      return NextResponse.json({ success: false, message: "Dictionary entry not found" }, { status: 404 })
    }
    return NextResponse.json({ success: false, message: "Failed to update dictionary entry" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = request.cookies.get("auth-token")?.value
    if (!token) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ success: false, error: "Invalid authentication" }, { status: 401 })
    }

    const id = Number.parseInt(params.id)

    console.log("[API] Deleting dictionary entry ID:", id)

    const deletedEntry = await Prisma.dictionary.delete({
      where: { id },
    })

    console.log("[API] Successfully deleted entry:", deletedEntry)

    return NextResponse.json({
      success: true,
      data: deletedEntry,
      message: "Dictionary entry deleted successfully",
    })
  } catch (error: any) {
    console.error("[API] Error deleting word entry:", error)
    if (error.code === "P2025") {
      return NextResponse.json({ success: false, message: "Dictionary entry not found" }, { status: 404 })
    }
    return NextResponse.json({ success: false, message: "Failed to delete dictionary entry" }, { status: 500 })
  }
}
