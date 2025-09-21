import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Check if Azure DevOps credentials are configured
    const isConfigured = !!(
      process.env.AZURE_DEVOPS_ORG &&
      process.env.AZURE_DEVOPS_PROJECT &&
      process.env.AZURE_DEVOPS_PAT
    )

    // In a real implementation, you would test the connection
    // For now, we'll just check if credentials are configured
    return NextResponse.json({
      connected: isConfigured,
      lastSync: isConfigured ? new Date().toISOString() : null,
      organization: process.env.AZURE_DEVOPS_ORG || null,
      project: process.env.AZURE_DEVOPS_PROJECT || null
    })
  } catch (error) {
    return NextResponse.json(
      { connected: false, error: "Failed to check Azure DevOps status" },
      { status: 500 }
    )
  }
}