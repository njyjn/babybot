import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Feed ID is required' },
        { status: 400 }
      )
    }

    await prisma.feed.delete({
      where: { id: parseInt(id) },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting feed:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete feed' },
      { status: 500 }
    )
  }
}
