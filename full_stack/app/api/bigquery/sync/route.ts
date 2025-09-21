import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { insertRows, queryTable, BIGQUERY_CONFIG } from '@/lib/bigquery-client'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { dataType, projectId } = body

    // Validate input
    if (!dataType) {
      return NextResponse.json(
        { error: 'dataType is required (syntheticData, testCases, requirements, or projects)' },
        { status: 400 }
      )
    }

    // Build where clause for filtering
    const whereClause = projectId ? { projectId } : {}

    let data: any[] = []
    let tableName: keyof typeof BIGQUERY_CONFIG.tables

    switch (dataType) {
      case 'syntheticData':
        tableName = 'syntheticData'
        const syntheticData = await prisma.syntheticData.findMany({
          where: whereClause,
          include: {
            project: true
          }
        })

        data = syntheticData.map(item => ({
          id: item.id,
          project_id: item.projectId,
          project_name: item.project.name,
          name: item.name,
          type: item.type,
          schema: item.schema || null,  // Keep as string
          data: item.data || null,      // Keep as string
          created_at: item.createdAt.toISOString(),
          updated_at: item.updatedAt.toISOString()
        }))
        break

      case 'testCases':
        tableName = 'testCases'
        const testCases = await prisma.testCase.findMany({
          where: whereClause,
          include: {
            project: true,
            requirement: true
          }
        })

        data = testCases.map(item => ({
          id: item.id,
          test_case_id: null,  // TestCase model doesn't have testCaseId field
          requirement_id: item.requirementId || null,
          project_id: item.projectId,
          project_name: item.project.name,
          title: item.title,
          description: item.description || null,
          steps: item.steps || null,  // Keep as string
          expected_results: item.expectedResults || null,
          priority: item.priority || null,
          category: item.category || null,
          compliance_tags: item.compliance || null,  // Using compliance field
          status: item.status || null,
          created_at: item.createdAt.toISOString(),
          updated_at: item.updatedAt.toISOString()
        }))
        break

      case 'requirements':
        tableName = 'requirements'
        const requirements = await prisma.requirement.findMany({
          where: whereClause,
          include: {
            project: true
          }
        })

        data = requirements.map(item => ({
          id: item.id,
          requirement_id: null,  // Requirement model doesn't have requirementId field
          project_id: item.projectId,
          project_name: item.project.name,
          title: item.title,
          description: item.description || null,
          type: item.type || null,
          priority: item.priority || null,
          source: item.source || null,
          compliance_tags: item.complianceTags || null,
          created_at: item.createdAt.toISOString(),
          updated_at: item.updatedAt.toISOString()
        }))
        break

      case 'projects':
        tableName = 'projects'
        const projects = await prisma.project.findMany({
          where: projectId ? { id: projectId } : {},
          include: {
            _count: {
              select: {
                testCases: true,
                requirements: true
              }
            }
          }
        })

        data = projects.map(item => ({
          id: item.id,
          name: item.name,
          description: item.description || null,
          test_case_count: item._count.testCases,
          requirement_count: item._count.requirements,
          created_at: item.createdAt.toISOString(),
          updated_at: item.updatedAt.toISOString()
        }))
        break

      default:
        return NextResponse.json(
          { error: 'Invalid dataType. Must be one of: syntheticData, testCases, requirements, projects' },
          { status: 400 }
        )
    }

    if (data.length === 0) {
      return NextResponse.json({
        message: 'No data found to sync',
        dataType,
        rowCount: 0
      })
    }

    // Insert data into BigQuery
    const result = await insertRows(tableName, data)

    return NextResponse.json({
      message: 'Data successfully synced to BigQuery',
      dataType,
      tableName: BIGQUERY_CONFIG.tables[tableName],
      dataset: BIGQUERY_CONFIG.datasetId,
      ...result
    })
  } catch (error: any) {
    console.error('BigQuery sync error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to sync data to BigQuery' },
      { status: 500 }
    )
  }
}

// GET endpoint to query BigQuery data
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const tableName = searchParams.get('table')
    const limit = searchParams.get('limit') || '100'

    if (!tableName) {
      return NextResponse.json(
        { error: 'table parameter is required' },
        { status: 400 }
      )
    }

    // Validate table name
    const validTables = Object.keys(BIGQUERY_CONFIG.tables)
    if (!validTables.includes(tableName)) {
      return NextResponse.json(
        { error: `Invalid table name. Must be one of: ${validTables.join(', ')}` },
        { status: 400 }
      )
    }

    const tableId = BIGQUERY_CONFIG.tables[tableName as keyof typeof BIGQUERY_CONFIG.tables]
    const fullTableId = `${BIGQUERY_CONFIG.projectId}.${BIGQUERY_CONFIG.datasetId}.${tableId}`

    // Query the table
    const query = `
      SELECT *
      FROM \`${fullTableId}\`
      ORDER BY sync_timestamp DESC
      LIMIT ${parseInt(limit)}
    `

    const rows = await queryTable(query)

    // Get row count
    const countQuery = `SELECT COUNT(*) as total FROM \`${fullTableId}\``
    const [countResult] = await queryTable(countQuery)

    return NextResponse.json({
      table: tableId,
      dataset: BIGQUERY_CONFIG.datasetId,
      totalRows: countResult.total,
      returnedRows: rows.length,
      data: rows
    })
  } catch (error: any) {
    console.error('BigQuery query error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to query BigQuery' },
      { status: 500 }
    )
  }
}