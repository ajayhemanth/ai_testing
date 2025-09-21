import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const activities = await prisma.activity.findMany({
      where: { projectId: id },
      orderBy: { createdAt: 'desc' },
      take: 50, // Limit to last 50 activities
    })

    return NextResponse.json(activities)
  } catch (error) {
    console.error('Activities API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch activities' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const body = await request.json()

    const activity = await prisma.activity.create({
      data: {
        projectId: id,
        type: body.type,
        description: body.description,
        metadata: body.metadata ? JSON.stringify(body.metadata) : null,
      },
    })

    return NextResponse.json(activity)
  } catch (error) {
    console.error('Create activity error:', error)
    return NextResponse.json(
      { error: 'Failed to create activity' },
      { status: 500 }
    )
  }
}