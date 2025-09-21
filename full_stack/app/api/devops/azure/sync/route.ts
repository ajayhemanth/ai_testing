import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// Simplified Azure DevOps sync for all test cases
export async function POST() {
  try {
    // Check if Azure DevOps is configured
    if (!process.env.AZURE_DEVOPS_ORG || !process.env.AZURE_DEVOPS_PROJECT || !process.env.AZURE_DEVOPS_PAT) {
      return NextResponse.json(
        { error: "Azure DevOps integration not configured" },
        { status: 400 }
      )
    }

    // First count total unsynced
    const totalUnsynced = await prisma.testCase.count({
      where: {
        azureId: null
      }
    })

    // Fetch test cases that haven't been synced to Azure DevOps (batch of 5)
    const testCases = await prisma.testCase.findMany({
      where: {
        azureId: null
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
    const baseUrl = `https://dev.azure.com/${process.env.AZURE_DEVOPS_ORG}/${process.env.AZURE_DEVOPS_PROJECT}/_apis`

    for (const testCase of testCases) {
      try {
        // Create steps XML format for Azure DevOps
        const stepsArray = testCase.testSteps ? testCase.testSteps.split("\n") : []
        let stepsXml = `<steps id="0" last="${stepsArray.length}">`

        stepsArray.forEach((step, index) => {
          stepsXml += `
            <step id="${index + 1}" type="ActionStep">
              <parameterizedString isformatted="true">${step}</parameterizedString>
              <parameterizedString isformatted="true">${testCase.expectedResults || ""}</parameterizedString>
            </step>`
        })
        stepsXml += "</steps>"

        // Create Azure DevOps work item payload
        const azurePayload = [
          {
            op: "add",
            path: "/fields/System.Title",
            value: testCase.title
          },
          {
            op: "add",
            path: "/fields/System.Description",
            value: testCase.description
          },
          {
            op: "add",
            path: "/fields/Microsoft.VSTS.TCM.Steps",
            value: stepsXml
          },
          {
            op: "add",
            path: "/fields/System.Tags",
            value: testCase.compliance || ""
          },
          {
            op: "add",
            path: "/fields/System.AreaPath",
            value: process.env.AZURE_DEVOPS_PROJECT
          }
        ]

        // Create auth header (PAT token)
        const auth = Buffer.from(`:${process.env.AZURE_DEVOPS_PAT}`).toString("base64")

        // Make request to Azure DevOps API
        const response = await fetch(
          `${baseUrl}/wit/workitems/$Test%20Case?api-version=7.0`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json-patch+json",
              "Authorization": `Basic ${auth}`
            },
            body: JSON.stringify(azurePayload)
          }
        )

        if (response.ok) {
          const azureData = await response.json()

          // Update test case with Azure ID
          await prisma.testCase.update({
            where: { id: testCase.id },
            data: { azureId: azureData.id.toString() }
          })

          syncResults.push({
            testCaseId: testCase.id,
            azureId: azureData.id,
            status: "success"
          })
        } else {
          const errorText = await response.text()
          syncResults.push({
            testCaseId: testCase.id,
            status: "failed",
            error: `Failed to create Azure DevOps work item: ${errorText}`
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
      message: `Synced ${successCount} test cases to Azure DevOps${remainingCount > 0 ? ` (${remainingCount} remaining)` : ' (all synced!)'}`,
      results: syncResults,
      totalUnsynced,
      synced: successCount,
      remaining: remainingCount
    })
  } catch (error) {
    console.error("Azure DevOps sync error:", error)
    return NextResponse.json(
      { error: "Failed to sync with Azure DevOps" },
      { status: 500 }
    )
  }
}