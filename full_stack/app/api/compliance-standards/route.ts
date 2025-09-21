import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const standards = await prisma.complianceStandard.findMany({
      orderBy: {
        name: 'asc',
      },
    })

    return NextResponse.json(standards)
  } catch (error) {
    console.error('Compliance standards API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch compliance standards' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const standard = await prisma.complianceStandard.create({
      data: {
        name: body.name,
        version: body.version,
        country: body.country,
        description: body.description,
        categories: body.categories,
      },
    })

    return NextResponse.json(standard)
  } catch (error) {
    console.error('Create compliance standard error:', error)
    return NextResponse.json(
      { error: 'Failed to create compliance standard' },
      { status: 500 }
    )
  }
}