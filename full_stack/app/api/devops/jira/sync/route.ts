import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// Simplified Jira sync for all test cases
export async function POST() {
  try {
    // Check if Jira is configured
    if (!process.env.JIRA_URL || !process.env.JIRA_EMAIL || !process.env.JIRA_API_TOKEN) {
      return NextResponse.json(
        { error: "Jira integration not configured" },
        { status: 400 }
      )
    }

    // First count total unsynced
    const totalUnsynced = await prisma.testCase.count({
      where: {
        jiraId: null
      }
    })

    // Fetch test cases that haven't been synced to Jira (batch of 5)
    const testCases = await prisma.testCase.findMany({
      where: {
        jiraId: null
      },
      take: 5,
      include: {
        requirement: {
          include: {
            project: true
          }
        }
      }
    })

    const syncResults = []

    for (const testCase of testCases) {
      try {
        // Create Jira issue payload
        const jiraPayload = {
          fields: {
            project: {
              key: process.env.JIRA_PROJECT_KEY
            },
            summary: testCase.title,
            description: {
              type: "doc",
              version: 1,
              content: [
                {
                  type: "paragraph",
                  content: [
                    {
                      type: "text",
                      text: `Test Case: ${testCase.title}\n\n`
                    }
                  ]
                },
                {
                  type: "paragraph",
                  content: [
                    {
                      type: "text",
                      text: `Description: ${testCase.description}\n`
                    }
                  ]
                },
                {
                  type: "paragraph",
                  content: [
                    {
                      type: "text",
                      text: `Steps:\n${testCase.testSteps || testCase.steps || ""}`
                    }
                  ]
                },
                {
                  type: "paragraph",
                  content: [
                    {
                      type: "text",
                      text: `Expected Result: ${testCase.expectedResults || testCase.expectedResult || ""}`
                    }
                  ]
                }
              ]
            },
            issuetype: {
              name: "Task"
            },
            labels: testCase.compliance ? testCase.compliance.split(",") : []
          }
        }

        // Create auth header
        const auth = Buffer.from(
          `${process.env.JIRA_EMAIL}:${process.env.JIRA_API_TOKEN}`
        ).toString("base64")

        // Make request to Jira API
        const response = await fetch(
          `${process.env.JIRA_URL}/rest/api/3/issue`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Basic ${auth}`
            },
            body: JSON.stringify(jiraPayload)
          }
        )

        if (response.ok) {
          const jiraData = await response.json()

          // Update test case with Jira ID
          await prisma.testCase.update({
            where: { id: testCase.id },
            data: { jiraId: jiraData.key }
          })

          syncResults.push({
            testCaseId: testCase.id,
            jiraId: jiraData.key,
            status: "success"
          })
        } else {
          syncResults.push({
            testCaseId: testCase.id,
            status: "failed",
            error: `Failed to create Jira issue: ${response.statusText}`
          })
        }
      } catch (error: any) {
        syncResults.push({
          testCaseId: testCase.id,
          status: "failed",
          error: error.message || 'Unknown error'
        })
      }
    }

    const successCount = syncResults.filter(r => r.status === "success").length
    const remainingCount = totalUnsynced - successCount

    return NextResponse.json({
      message: `Synced ${successCount} test cases to Jira${remainingCount > 0 ? ` (${remainingCount} remaining)` : ' (all synced!)'}`,
      results: syncResults,
      totalUnsynced,
      synced: successCount,
      remaining: remainingCount
    })
  } catch (error) {
    console.error("Jira sync error:", error)
    return NextResponse.json(
      { error: "Failed to sync with Jira" },
      { status: 500 }
    )
  }
}