import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, name } = body;

    if (!id || !name) {
      return NextResponse.json(
        { success: false, error: "ID and name are required" },
        { status: 400 },
      );
    }

    const baby = await prisma.baby.update({
      where: { id: parseInt(id) },
      data: { name },
    });

    return NextResponse.json({ success: true, baby });
  } catch (error) {
    console.error("Error updating baby:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update baby" },
      { status: 500 },
    );
  }
}
