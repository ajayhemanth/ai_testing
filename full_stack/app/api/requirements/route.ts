import { NextResponse, NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const projectId = searchParams.get('projectId')

    const requirements = await prisma.requirement.findMany({
      where: projectId ? { projectId } : undefined,
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({ requirements })
  } catch (error) {
    console.error('Requirements API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch requirements' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const requirement = await prisma.requirement.create({
      data: {
        projectId: body.projectId,
        title: body.title,
        description: body.description,
        type: body.category || body.type || 'functional',
        priority: body.priority || 'medium',
        status: body.status || 'pending',
        source: body.source,
        complianceTags: body.complianceTags,
      },
    })

    return NextResponse.json(requirement)
  } catch (error) {
    console.error('Create requirement error:', error)
    return NextResponse.json(
      { error: 'Failed to create requirement' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json()
    const { ids } = body

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request: ids array required' },
        { status: 400 }
      )
    }

    const result = await prisma.requirement.deleteMany({
      where: {
        id: {
          in: ids
        }
      }
    })

    return NextResponse.json({
      message: `Successfully deleted ${result.count} requirement(s)`,
      count: result.count
    })
  } catch (error) {
    console.error('Bulk delete requirements error:', error)
    return NextResponse.json(
      { error: 'Failed to delete requirements' },
      { status: 500 }
    )
  }
}