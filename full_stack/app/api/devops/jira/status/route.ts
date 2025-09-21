import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Check if Jira credentials are configured
    const isConfigured = !!(
      process.env.JIRA_URL &&
      process.env.JIRA_EMAIL &&
      process.env.JIRA_API_TOKEN &&
      process.env.JIRA_PROJECT_KEY
    )

    // In a real implementation, you would test the connection
    // For now, we'll just check if credentials are configured
    return NextResponse.json({
      connected: isConfigured,
      lastSync: isConfigured ? new Date().toISOString() : null,
      project: process.env.JIRA_PROJECT_KEY || null
    })
  } catch (error) {
    return NextResponse.json(
      { connected: false, error: "Failed to check Jira status" },
      { status: 500 }
    )
  }
}