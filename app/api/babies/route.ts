import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const babies = await prisma.baby.findMany({
      orderBy: {
        createdAt: 'asc',
      },
    })

    return NextResponse.json({ success: true, babies })
  } catch (error) {
    console.error('Error fetching babies:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch babies' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, birthDate } = body

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Name is required' },
        { status: 400 }
      )
    }

    const baby = await prisma.baby.create({
      data: {
        name,
        birthDate: birthDate ? new Date(birthDate) : new Date(),
      },
    })

    return NextResponse.json({ success: true, baby })
  } catch (error) {
    console.error('Error creating baby:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create baby' },
      { status: 500 }
    )
  }
}
