import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// Sync single test case to Jira
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const testCaseId = id

    // Check if Jira is configured
    if (!process.env.JIRA_URL || !process.env.JIRA_EMAIL || !process.env.JIRA_API_TOKEN) {
      return NextResponse.json(
        { error: "Jira integration not configured" },
        { status: 400 }
      )
    }

    // Fetch the test case
    const testCase = await prisma.testCase.findUnique({
      where: { id: testCaseId },
      include: {
        requirement: {
          include: {
            project: true
          }
        }
      }
    })

    if (!testCase) {
      return NextResponse.json(
        { error: "Test case not found" },
        { status: 404 }
      )
    }

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

    // If testCase already has jiraId, update it instead
    if (testCase.jiraId) {
      const response = await fetch(
        `${process.env.JIRA_URL}/rest/api/3/issue/${testCase.jiraId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Basic ${auth}`
          },
          body: JSON.stringify(jiraPayload)
        }
      )

      if (response.ok || response.status === 204) {
        return NextResponse.json({
          message: `Test case "${testCase.title}" updated in Jira`,
          jiraId: testCase.jiraId
        })
      } else {
        return NextResponse.json(
          { error: `Failed to update Jira issue: ${response.statusText}` },
          { status: response.status }
        )
      }
    } else {
      // Create new Jira issue
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

        return NextResponse.json({
          message: `Test case "${testCase.title}" created in Jira`,
          jiraId: jiraData.key
        })
      } else {
        const errorText = await response.text()
        return NextResponse.json(
          { error: `Failed to create Jira issue: ${errorText}` },
          { status: response.status }
        )
      }
    }
  } catch (error: any) {
    console.error("Jira sync error:", error)
    return NextResponse.json(
      { error: `Failed to sync with Jira: ${error.message || error}` },
      { status: 500 }
    )
  }
}