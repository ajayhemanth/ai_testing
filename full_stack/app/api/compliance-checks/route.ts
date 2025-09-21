import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const checks = await prisma.complianceCheck.findMany({
      include: {
        standard: true,
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        checkedAt: 'desc',
      },
    })

    return NextResponse.json(checks)
  } catch (error) {
    console.error('Compliance checks API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch compliance checks' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const check = await prisma.complianceCheck.create({
      data: {
        projectId: body.projectId,
        standardId: body.standardId,
        status: body.status,
        coverage: body.coverage,
        findings: body.findings,
        checkedAt: body.checkedAt || new Date(),
      },
    })

    return NextResponse.json(check)
  } catch (error) {
    console.error('Create compliance check error:', error)
    return NextResponse.json(
      { error: 'Failed to create compliance check' },
      { status: 500 }
    )
  }
}