import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date");

    // Parse date or use today
    const targetDate = dateParam ? new Date(dateParam) : new Date();

    // Get start of day
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);

    // Get end of day
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const feeds = await prisma.feed.findMany({
      where: {
        startTime: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        feedType: true,
        baby: true,
      },
      orderBy: {
        startTime: "desc",
      },
    });

    return NextResponse.json({ success: true, feeds });
  } catch (error) {
    console.error("Error fetching feeds:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch feeds" },
      { status: 500 },
    );
  }
}
