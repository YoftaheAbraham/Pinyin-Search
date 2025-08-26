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

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)
    const body = await request.json()
    const { chinese, english, pinyin } = body

    console.log("[API] Updating dictionary entry ID:", id, "with data:", { chinese, english, pinyin })

    if (!chinese || !english || !pinyin) {
      return NextResponse.json(
        { success: false, message: "Chinese, English, and Pinyin are required" },
        { status: 400 },
      )
    }

    const entryIndex = mockDictionary.findIndex((entry) => entry.id === id)
    if (entryIndex === -1) {
      return NextResponse.json({ success: false, message: "Dictionary entry not found" }, { status: 404 })
    }

    const existingEntry = mockDictionary.find(
      (entry) => entry.id !== id && (entry.chinese === chinese || entry.english === english),
    )

    if (existingEntry) {
      return NextResponse.json(
        { success: false, message: "Another entry with this Chinese or English word already exists" },
        { status: 409 },
      )
    }

    mockDictionary[entryIndex] = {
      id,
      chinese: chinese.trim(),
      english: english.trim(),
      pinyin: pinyin.trim(),
    }

    console.log("[API] Successfully updated entry ID:", id)

    return NextResponse.json({
      success: true,
      data: mockDictionary[entryIndex],
      message: "Dictionary entry updated successfully",
    })
  } catch (error) {
    console.error("[API] Error updating word entry:", error)
    return NextResponse.json({ success: false, message: "Failed to update dictionary entry" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)

    console.log("[API] Deleting dictionary entry ID:", id)

    const entryIndex = mockDictionary.findIndex((entry) => entry.id === id)
    if (entryIndex === -1) {
      return NextResponse.json({ success: false, message: "Dictionary entry not found" }, { status: 404 })
    }

    const deletedEntry = mockDictionary.splice(entryIndex, 1)[0]

    console.log("[API] Successfully deleted entry:", deletedEntry)

    return NextResponse.json({
      success: true,
      data: deletedEntry,
      message: "Dictionary entry deleted successfully",
    })
  } catch (error) {
    console.error("[API] Error deleting word entry:", error)
    return NextResponse.json({ success: false, message: "Failed to delete dictionary entry" }, { status: 500 })
  }
}
