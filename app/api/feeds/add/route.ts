import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notifySlack } from "@/lib/slack";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { feedType, amountMl, notes, customTime } = body;

    // Get or create default baby (for single baby tracking)
    let baby = await prisma.baby.findFirst();
    if (!baby) {
      baby = await prisma.baby.create({
        data: {
          name: "Baby",
          birthDate: new Date(),
        },
      });
    }

    // Get or create feed type
    const type = await prisma.feedType.upsert({
      where: { name: feedType },
      update: {},
      create: { name: feedType },
    });

    // Use custom time if provided, otherwise use current time
    const feedTime = customTime ? new Date(customTime) : new Date();

    // Create feed record
    const feed = await prisma.feed.create({
      data: {
        babyId: baby.id,
        feedTypeId: type.id,
        startTime: feedTime,
        endTime: feedTime,
        amountMl: amountMl || null,
        notes: notes || null,
      },
      include: {
        feedType: true,
      },
    });

    // Send Slack notification
    const emoji = feedType === "Milk" ? "🍼" : "🍽️";
    const message = `${emoji} *${feedType} logged*`;
    const details: Record<string, string> = {
      Time: feedTime.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }),
    };

    if (amountMl) {
      details["Amount"] = `${Math.round(amountMl)} ml`;
    }

    if (notes) {
      details["Notes"] = notes;
    }

    await notifySlack(message, details);

    return NextResponse.json({ success: true, feed });
  } catch (error) {
    console.error("Error adding feed:", error);
    return NextResponse.json(
      { success: false, error: "Failed to add feed" },
      { status: 500 },
    );
  }
}
