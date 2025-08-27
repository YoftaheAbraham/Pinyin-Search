import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"
import { Prisma } from "@/lib/prisma.client"

export async function POST(request: NextRequest) {
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
    const { entries } = body

    console.log("[API] Creating batch dictionary entries:", entries?.length, "entries")

    if (!Array.isArray(entries) || entries.length === 0) {
      return NextResponse.json(
        { success: false, message: "Entries array is required and must not be empty" },
        { status: 400 },
      )
    }

    const results = []
    const errors = []

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i]
      const { chinese, english, pinyin, phonetic, status } = entry

      try {
        if (!chinese || !english || !pinyin || !phonetic) {
          errors.push({
            index: i,
            entry,
            error: "Chinese, English, Pinyin, and Phonetic are required",
          })
          continue
        }

        const existingEntry = await Prisma.dictionary.findFirst({
          where: {
            OR: [{ chinese: { equals: chinese } }, { english: { equals: english } }],
          },
        })

        if (existingEntry) {
          errors.push({
            index: i,
            entry,
            error: "Entry with this Chinese or English word already exists",
          })
          continue
        }

        const newEntry = await Prisma.dictionary.create({
          data: {
            chinese: chinese.trim(),
            english: english.trim(),
            pinyin: pinyin.trim(),
            phonetic: phonetic.trim(),
            status: status || "NOT_REVIEWED",
          },
        })

        results.push(newEntry)
      } catch (error) {
        errors.push({
          index: i,
          entry,
          error: "Failed to process entry",
        })
      }
    }

    console.log("[API] Batch creation completed:", results.length, "successful,", errors.length, "failed")

    return NextResponse.json(
      {
        success: true,
        data: {
          created: results,
          errors: errors,
          summary: {
            total: entries.length,
            successful: results.length,
            failed: errors.length,
          },
        },
        message: `Batch operation completed: ${results.length} created, ${errors.length} failed`,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("[API] Error in batch word creation:", error)
    return NextResponse.json({ success: false, message: "Failed to process batch dictionary entries" }, { status: 500 })
  }
}
