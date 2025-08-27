import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"
import { Prisma } from "@/lib/prisma.client"

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = request.cookies.get("auth-token")?.value
    if (!token) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload || payload.role !== "SUPER_ADMIN") {
      return NextResponse.json({ success: false, error: "Super admin access required" }, { status: 403 })
    }

    const adminId = Number.parseInt(params.id)
    const body = await request.json()
    const { isActive, role } = body

    // Prevent deactivating self
    if (payload.adminId === adminId && isActive === false) {
      return NextResponse.json(
        {
          success: false,
          error: "Cannot deactivate your own account",
        },
        { status: 400 },
      )
    }

    const updatedAdmin = await Prisma.admin.update({
      where: { id: adminId },
      data: {
        ...(typeof isActive === "boolean" && { isActive }),
        ...(role && { role }),
        updatedAt: new Date(),
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({
      success: true,
      data: updatedAdmin,
      message: "Admin updated successfully",
    })
  } catch (error: any) {
    console.error("[v0] Error updating admin:", error)
    if (error.code === "P2025") {
      return NextResponse.json({ success: false, error: "Admin not found" }, { status: 404 })
    }
    return NextResponse.json({ success: false, error: "Failed to update admin" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = request.cookies.get("auth-token")?.value
    if (!token) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload || payload.role !== "SUPER_ADMIN") {
      return NextResponse.json({ success: false, error: "Super admin access required" }, { status: 403 })
    }

    const adminId = Number.parseInt(params.id)

    // Prevent deleting self
    if (payload.adminId === adminId) {
      return NextResponse.json(
        {
          success: false,
          error: "Cannot delete your own account",
        },
        { status: 400 },
      )
    }

    await Prisma.admin.delete({
      where: { id: adminId },
    })

    return NextResponse.json({
      success: true,
      message: "Admin deleted successfully",
    })
  } catch (error: any) {
    console.error("[v0] Error deleting admin:", error)
    if (error.code === "P2025") {
      return NextResponse.json({ success: false, error: "Admin not found" }, { status: 404 })
    }
    return NextResponse.json({ success: false, error: "Failed to delete admin" }, { status: 500 })
  }
}
