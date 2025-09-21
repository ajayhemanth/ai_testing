import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const requirement = await prisma.requirement.findUnique({
      where: { id },
      include: {
        project: true,
      },
    })

    if (!requirement) {
      return NextResponse.json(
        { error: 'Requirement not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(requirement)
  } catch (error) {
    console.error('Requirement API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch requirement' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const body = await request.json()

    const updatedRequirement = await prisma.requirement.update({
      where: { id },
      data: body,
    })

    return NextResponse.json(updatedRequirement)
  } catch (error) {
    console.error('Update requirement error:', error)
    return NextResponse.json(
      { error: 'Failed to update requirement' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    await prisma.requirement.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Requirement deleted successfully' })
  } catch (error) {
    console.error('Delete requirement error:', error)
    return NextResponse.json(
      { error: 'Failed to delete requirement' },
      { status: 500 }
    )
  }
}