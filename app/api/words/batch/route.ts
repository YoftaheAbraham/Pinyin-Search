import { type NextRequest, NextResponse } from "next/server"

const mockDictionary = [
  { id: 1, chinese: "你好", english: "hello", pinyin: "nǐ hǎo" },
  { id: 2, chinese: "谢谢", english: "thank you", pinyin: "xiè xiè" },
  { id: 3, chinese: "再见", english: "goodbye", pinyin: "zài jiàn" },
  { id: 4, chinese: "朋友", english: "friend", pinyin: "péng yǒu" },
  { id: 5, chinese: "学习", english: "study", pinyin: "xué xí" },
  { id: 6, chinese: "工作", english: "work", pinyin: "gōng zuò" },
  { id: 7, chinese: "家庭", english: "family", pinyin: "jiā tíng" },
  { id: 8, chinese: "时间", english: "time", pinyin: "shí jiān" },
]

export async function POST(request: NextRequest) {
  try {
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
      const { chinese, english, pinyin } = entry

      try {
        if (!chinese || !english || !pinyin) {
          errors.push({
            index: i,
            entry,
            error: "Chinese, English, and Pinyin are required",
          })
          continue
        }

        const existingEntry = mockDictionary.find(
          (existing) => existing.chinese === chinese || existing.english === english,
        )

        if (existingEntry) {
          errors.push({
            index: i,
            entry,
            error: "Entry with this Chinese or English word already exists",
          })
          continue
        }

        const newEntry: any = {
          id: Math.max(...mockDictionary.map((d) => d.id)) + results.length + 1,
          chinese: chinese.trim(),
          english: english.trim(),
          pinyin: pinyin.trim(),
        }

        mockDictionary.push(newEntry)
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
