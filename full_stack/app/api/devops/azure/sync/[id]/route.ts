import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// Sync single test case to Azure DevOps
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const testCaseId = id

    // Check if Azure DevOps is configured
    if (!process.env.AZURE_DEVOPS_ORG || !process.env.AZURE_DEVOPS_PROJECT || !process.env.AZURE_DEVOPS_PAT) {
      return NextResponse.json(
        { error: "Azure DevOps integration not configured" },
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

    const baseUrl = `https://dev.azure.com/${process.env.AZURE_DEVOPS_ORG}/${process.env.AZURE_DEVOPS_PROJECT}/_apis`

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
        op: testCase.azureId ? "replace" : "add",
        path: "/fields/System.Title",
        value: testCase.title
      },
      {
        op: testCase.azureId ? "replace" : "add",
        path: "/fields/System.Description",
        value: testCase.description
      },
      {
        op: testCase.azureId ? "replace" : "add",
        path: "/fields/Microsoft.VSTS.TCM.Steps",
        value: stepsXml
      },
      {
        op: testCase.azureId ? "replace" : "add",
        path: "/fields/System.Tags",
        value: testCase.compliance || ""
      }
    ]

    // Only add AreaPath for new items
    if (!testCase.azureId) {
      azurePayload.push({
        op: "add",
        path: "/fields/System.AreaPath",
        value: process.env.AZURE_DEVOPS_PROJECT
      })
    }

    // Create auth header (PAT token)
    const auth = Buffer.from(`:${process.env.AZURE_DEVOPS_PAT}`).toString("base64")

    // If testCase already has azureId, update it instead
    if (testCase.azureId) {
      const response = await fetch(
        `${baseUrl}/wit/workitems/${testCase.azureId}?api-version=7.0`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json-patch+json",
            "Authorization": `Basic ${auth}`
          },
          body: JSON.stringify(azurePayload)
        }
      )

      if (response.ok) {
        return NextResponse.json({
          message: `Test case "${testCase.title}" updated in Azure DevOps`,
          azureId: testCase.azureId
        })
      } else {
        const errorText = await response.text()
        return NextResponse.json(
          { error: `Failed to update Azure DevOps work item: ${errorText}` },
          { status: response.status }
        )
      }
    } else {
      // Create new Azure DevOps work item
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

        return NextResponse.json({
          message: `Test case "${testCase.title}" created in Azure DevOps`,
          azureId: azureData.id
        })
      } else {
        const errorText = await response.text()
        return NextResponse.json(
          { error: `Failed to create Azure DevOps work item: ${errorText}` },
          { status: response.status }
        )
      }
    }
  } catch (error: any) {
    console.error("Azure DevOps sync error:", error)
    return NextResponse.json(
      { error: `Failed to sync with Azure DevOps: ${error.message || error}` },
      { status: 500 }
    )
  }
}