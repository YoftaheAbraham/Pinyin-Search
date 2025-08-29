import { type NextRequest, NextResponse } from "next/server"
import { Prisma } from "@/lib/prisma.client"

export async function GET(request: NextRequest) {
  try {
    
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim().toLowerCase() || "";
    if (!query) {
      const allEntries = await Prisma.dictionary.findMany();
      return NextResponse.json({ success: true, count: allEntries.length, data: allEntries });
    }
    const entries = await Prisma.dictionary.findMany({
      where: {
        OR: [
          { chinese: { startsWith: query, mode: "insensitive" } },
          { english: { startsWith: query, mode: "insensitive" } },
          { pinyin: { startsWith: query, mode: "insensitive" } },
          { phonetic: { startsWith: query, mode: "insensitive" } },
        ],
      },
    });
    return NextResponse.json({ success: true, count: entries.length, data: entries });
  
  } catch (error) {
    console.error("[API] Error searching dictionary:", error);
    return NextResponse.json({ success: false, message: "Failed to search dictionary" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { chinese, english, pinyin, phonetic, status } = body;

    console.log("[API] Creating new dictionary entry:", { chinese, english, pinyin, phonetic, status });

    if (!chinese || !english || !pinyin || !phonetic) {
      return NextResponse.json(
        { success: false, message: "Chinese, English, Piniyin and Phonetics are required" },
        { status: 400 }
      );
    }
    const existingEntry = await Prisma.dictionary.findFirst({
      where: {
        OR: [
          { chinese: { equals: chinese } },
          { english: { equals: english } },
        ],
      },
    });

    if (existingEntry) {
      return NextResponse.json(
        { 
          success: false, 
          message: "Entry with this Chinese or English word already exists",
          existingEntry,
        },
        { status: 409 }
      );
    }
    const newEntry = await Prisma.dictionary.create({
      data: {
        chinese,
        english,
        pinyin,
        phonetic: phonetic,
        status: status || "NOT_REVIEWED",
      },
    });

    console.log("[API] Successfully created entry with ID:", newEntry.id);

    return NextResponse.json(
      {
        success: true,
        data: newEntry,
        message: "Dictionary entry created successfully",
      },
      { status: 201 }
    );

  } catch (error) {
    console.error("[API] Error creating word entry:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create dictionary entry" },
      { status: 500 }
    );
  }
}
