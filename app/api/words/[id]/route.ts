import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"
import {Prisma} from "@/lib/prisma.client"  

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

    const id = params.id
    if (!id || id.length !== 36) {
      return NextResponse.json({ success: false, error: "Invalid ID format" }, { status: 400 })
    }

    const body = await request.json()
    let { chinese, english, pinyin, phonetic, status } = body

    if (!chinese?.trim() || !english?.trim() || !pinyin?.trim() || !phonetic?.trim()) {
      return NextResponse.json(
        { success: false, error: "Chinese, English, Pinyin, and Phonetic are required" },
        { status: 400 },
      )
    }
    english = english.trim().toLowerCase()
    const existingEntry = await Prisma.dictionary.findFirst({
      where: {
        OR: [
          { english },
          { chinese: chinese.trim() },
        ],
      },
    })

    let updatedEntry
    if (existingEntry) {
      updatedEntry = await Prisma.dictionary.update({
        where: { id: existingEntry.id },
        data: {
          chinese: chinese.trim(),
          english,
          pinyin: pinyin.trim(),
          phonetic: phonetic.trim(),
          ...(status && { status }),
        },
      })
    } else {
      updatedEntry = await Prisma.dictionary.create({
        data: {
          chinese: chinese.trim(),
          english,
          pinyin: pinyin.trim(),
          phonetic: phonetic.trim(),
          ...(status && { status }),
        },
      })
    }

    return NextResponse.json({
      success: true,
      data: updatedEntry,
      message: existingEntry
        ? "Dictionary entry updated (merged with existing)"
        : "Dictionary entry created successfully",
    })
  } catch (error: any) {
    console.error("[API] Error saving entry:", error)
    return NextResponse.json({ success: false, error: "Failed to save dictionary entry" }, { status: 500 })
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

    const id = params.id
    if (!id || id.length !== 36) {
      return NextResponse.json({ success: false, error: "Invalid ID format" }, { status: 400 })
    }

    const deletedEntry = await Prisma.dictionary.delete({ where: { id } })

    return NextResponse.json({
      success: true,
      data: deletedEntry,
      message: "Dictionary entry deleted successfully",
    })
  } catch (error: any) {
    console.error("[API] Error deleting entry:", error)
    if (error.code === "P2025") {
      return NextResponse.json({ success: false, error: "Dictionary entry not found" }, { status: 404 })
    }
    return NextResponse.json({ success: false, error: "Failed to delete dictionary entry" }, { status: 500 })
  }
}
