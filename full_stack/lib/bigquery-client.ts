import { BigQuery } from '@google-cloud/bigquery'
import path from 'path'

// Initialize BigQuery client
const serviceAccountPath = path.join(process.cwd(), '..', 'service_account.json')

let bigqueryClient: BigQuery | null = null

export function getBigQueryClient(): BigQuery {
  if (!bigqueryClient) {
    bigqueryClient = new BigQuery({
      keyFilename: serviceAccountPath,
      projectId: 'cloud-billed-1'
    })
  }
  return bigqueryClient
}

// Dataset and table configuration
export const BIGQUERY_CONFIG = {
  projectId: 'cloud-billed-1',
  datasetId: 'TestCaseData1',
  tables: {
    syntheticData: 'synthetic_data',
    testCases: 'test_cases',
    requirements: 'requirements',
    projects: 'projects'
  }
}

// Schema definitions
export const SCHEMAS = {
  syntheticData: [
    { name: 'id', type: 'STRING', mode: 'REQUIRED' },
    { name: 'project_id', type: 'STRING', mode: 'REQUIRED' },
    { name: 'project_name', type: 'STRING', mode: 'NULLABLE' },
    { name: 'name', type: 'STRING', mode: 'REQUIRED' },
    { name: 'type', type: 'STRING', mode: 'REQUIRED' },
    { name: 'schema', type: 'STRING', mode: 'NULLABLE' },  // Changed from JSON to STRING
    { name: 'data', type: 'STRING', mode: 'NULLABLE' },    // Changed from JSON to STRING
    { name: 'created_at', type: 'TIMESTAMP', mode: 'REQUIRED' },
    { name: 'updated_at', type: 'TIMESTAMP', mode: 'REQUIRED' },
    { name: 'sync_timestamp', type: 'TIMESTAMP', mode: 'REQUIRED' }
  ],
  testCases: [
    { name: 'id', type: 'STRING', mode: 'REQUIRED' },
    { name: 'test_case_id', type: 'STRING', mode: 'NULLABLE' },
    { name: 'requirement_id', type: 'STRING', mode: 'NULLABLE' },
    { name: 'project_id', type: 'STRING', mode: 'REQUIRED' },
    { name: 'project_name', type: 'STRING', mode: 'NULLABLE' },
    { name: 'title', type: 'STRING', mode: 'REQUIRED' },
    { name: 'description', type: 'STRING', mode: 'NULLABLE' },
    { name: 'steps', type: 'STRING', mode: 'NULLABLE' },  // Changed from JSON to STRING
    { name: 'expected_results', type: 'STRING', mode: 'NULLABLE' },
    { name: 'priority', type: 'STRING', mode: 'NULLABLE' },
    { name: 'category', type: 'STRING', mode: 'NULLABLE' },
    { name: 'compliance_tags', type: 'STRING', mode: 'NULLABLE' },
    { name: 'status', type: 'STRING', mode: 'NULLABLE' },
    { name: 'created_at', type: 'TIMESTAMP', mode: 'REQUIRED' },
    { name: 'updated_at', type: 'TIMESTAMP', mode: 'REQUIRED' },
    { name: 'sync_timestamp', type: 'TIMESTAMP', mode: 'REQUIRED' }
  ],
  requirements: [
    { name: 'id', type: 'STRING', mode: 'REQUIRED' },
    { name: 'requirement_id', type: 'STRING', mode: 'NULLABLE' },
    { name: 'project_id', type: 'STRING', mode: 'REQUIRED' },
    { name: 'project_name', type: 'STRING', mode: 'NULLABLE' },
    { name: 'title', type: 'STRING', mode: 'REQUIRED' },
    { name: 'description', type: 'STRING', mode: 'NULLABLE' },
    { name: 'type', type: 'STRING', mode: 'NULLABLE' },
    { name: 'priority', type: 'STRING', mode: 'NULLABLE' },
    { name: 'source', type: 'STRING', mode: 'NULLABLE' },
    { name: 'compliance_tags', type: 'STRING', mode: 'NULLABLE' },
    { name: 'created_at', type: 'TIMESTAMP', mode: 'REQUIRED' },
    { name: 'updated_at', type: 'TIMESTAMP', mode: 'REQUIRED' },
    { name: 'sync_timestamp', type: 'TIMESTAMP', mode: 'REQUIRED' }
  ],
  projects: [
    { name: 'id', type: 'STRING', mode: 'REQUIRED' },
    { name: 'name', type: 'STRING', mode: 'REQUIRED' },
    { name: 'description', type: 'STRING', mode: 'NULLABLE' },
    { name: 'test_case_count', type: 'INTEGER', mode: 'NULLABLE' },
    { name: 'requirement_count', type: 'INTEGER', mode: 'NULLABLE' },
    { name: 'created_at', type: 'TIMESTAMP', mode: 'REQUIRED' },
    { name: 'updated_at', type: 'TIMESTAMP', mode: 'REQUIRED' },
    { name: 'sync_timestamp', type: 'TIMESTAMP', mode: 'REQUIRED' }
  ]
}

// Helper function to ensure dataset and table exist
export async function ensureDatasetAndTable(tableName: keyof typeof BIGQUERY_CONFIG.tables) {
  const bigquery = getBigQueryClient()
  const datasetId = BIGQUERY_CONFIG.datasetId
  const tableId = BIGQUERY_CONFIG.tables[tableName]

  try {
    // Create dataset if it doesn't exist
    const dataset = bigquery.dataset(datasetId)
    const [datasetExists] = await dataset.exists()

    if (!datasetExists) {
      await bigquery.createDataset(datasetId, {
        location: 'US'
      })
      console.log(`Created dataset ${datasetId}`)
    }

    // Create table if it doesn't exist
    const table = dataset.table(tableId)
    const [tableExists] = await table.exists()

    if (!tableExists) {
      const schema = SCHEMAS[tableName]
      if (!schema) {
        throw new Error(`No schema defined for table ${tableName}`)
      }

      await dataset.createTable(tableId, {
        schema: schema
      })
      console.log(`Created table ${tableId}`)
    }

    return { dataset, table }
  } catch (error) {
    console.error(`Error ensuring dataset/table for ${tableName}:`, error)
    throw error
  }
}

// Helper function to insert rows
export async function insertRows(tableName: keyof typeof BIGQUERY_CONFIG.tables, rows: any[]) {
  const bigquery = getBigQueryClient()
  const datasetId = BIGQUERY_CONFIG.datasetId
  const tableId = BIGQUERY_CONFIG.tables[tableName]

  try {
    const { table } = await ensureDatasetAndTable(tableName)

    // Add sync timestamp to all rows
    const rowsWithTimestamp = rows.map(row => ({
      ...row,
      sync_timestamp: new Date().toISOString()
    }))

    // Insert rows
    try {
      await table.insert(rowsWithTimestamp, {
        skipInvalidRows: false,
        ignoreUnknownValues: false
      })
    } catch (insertError: any) {
      console.error('BigQuery insert error details:', {
        message: insertError.message,
        errors: insertError.errors,
        response: insertError.response
      })

      // Extract detailed error messages
      if (insertError.errors && insertError.errors.length > 0) {
        const errorMessages = insertError.errors.map((err: any) => {
          return `Row ${err.row || 'unknown'}: ${JSON.stringify(err.errors)}`
        }).join('; ')
        throw new Error(`BigQuery insert failed: ${errorMessages}`)
      }

      throw new Error(`BigQuery insert failed: ${insertError.message}`)
    }

    console.log(`Successfully inserted ${rows.length} rows into ${tableId}`)
    return { success: true, rowCount: rows.length }
  } catch (error) {
    console.error(`Error inserting rows into ${tableName}:`, error)
    throw error
  }
}

// Query helper function
export async function queryTable(query: string) {
  const bigquery = getBigQueryClient()

  try {
    const [rows] = await bigquery.query({
      query,
      location: 'US'
    })
    return rows
  } catch (error) {
    console.error('Query error:', error)
    throw error
  }
}