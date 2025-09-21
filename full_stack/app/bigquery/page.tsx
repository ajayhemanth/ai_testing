"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, Upload, Database, CheckCircle, XCircle, Cloud } from "lucide-react"

export default function BigQuerySyncPage() {
  const [selectedDataType, setSelectedDataType] = useState<string>("")
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [queryResult, setQueryResult] = useState<any>(null)

  const dataTypes = [
    { value: "syntheticData", label: "Synthetic Data", description: "AI-generated test data" },
    { value: "testCases", label: "Test Cases", description: "Test cases and scenarios" },
    { value: "requirements", label: "Requirements", description: "Project requirements" },
    { value: "projects", label: "Projects", description: "Project information" },
  ]

  const handleSync = async () => {
    if (!selectedDataType) {
      setError("Please select a data type to sync")
      return
    }

    setIsSyncing(true)
    setError(null)
    setSyncResult(null)

    try {
      const response = await fetch("/api/bigquery/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          dataType: selectedDataType
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to sync data")
      }

      setSyncResult(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSyncing(false)
    }
  }

  const handleQuery = async () => {
    if (!selectedDataType) {
      setError("Please select a data type to query")
      return
    }

    setError(null)
    setQueryResult(null)

    try {
      const response = await fetch(`/api/bigquery/sync?table=${selectedDataType}&limit=10`)
      const data = await response.json()

      if (!response.ok) {
        // Check if it's a "table not found" error
        if (data.error && data.error.includes("not found")) {
          const dataTypeLabel = dataTypes.find(dt => dt.value === selectedDataType)?.label || selectedDataType
          throw new Error(`Table doesn't exist yet. Please sync "${dataTypeLabel}" first by clicking "Sync to BigQuery" to create the table and populate it with data.`)
        }
        throw new Error(data.error || "Failed to query data")
      }

      console.log("Query results:", data)
      setQueryResult(data)
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Cloud className="h-8 w-8 text-blue-600" />
          BigQuery Data Sync
        </h1>
        <p className="text-muted-foreground">
          Sync your healthcare testing data to Google BigQuery for analytics and reporting
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Select Data to Sync</CardTitle>
          <CardDescription>
            Choose which type of data you want to push to BigQuery. Note: You must sync data first before querying.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select value={selectedDataType} onValueChange={setSelectedDataType}>
            <SelectTrigger>
              <SelectValue placeholder="Select data type..." />
            </SelectTrigger>
            <SelectContent>
              {dataTypes.map(type => (
                <SelectItem key={type.value} value={type.value}>
                  <div>
                    <div className="font-medium">{type.label}</div>
                    <div className="text-sm text-muted-foreground">{type.description}</div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex gap-2">
            <Button
              onClick={handleSync}
              disabled={!selectedDataType || isSyncing}
              className="flex-1"
            >
              {isSyncing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Sync to BigQuery
                </>
              )}
            </Button>

            <Button
              onClick={handleQuery}
              disabled={!selectedDataType}
              variant="outline"
            >
              <Database className="mr-2 h-4 w-4" />
              Query Data
            </Button>
          </div>
        </CardContent>
      </Card>

      {syncResult && (
        <Alert className="mb-6">
          <CheckCircle className="h-4 w-4" />
          <AlertTitle>Sync Complete</AlertTitle>
          <AlertDescription>
            <div className="mt-2 space-y-1">
              <p><strong>Dataset:</strong> {syncResult.dataset}</p>
              <p><strong>Table:</strong> {syncResult.tableName}</p>
              <p><strong>Rows Synced:</strong> {syncResult.rowCount}</p>
              <p className="text-sm text-muted-foreground mt-2">
                Data is now available in BigQuery for analysis
              </p>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive" className="mb-6">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {queryResult && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Query Results
            </CardTitle>
            <CardDescription>
              Table: {queryResult.table} | Rows: {queryResult.returnedRows} of {queryResult.totalRows} total
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-muted p-4 rounded-lg overflow-auto max-h-96">
              <pre className="text-xs font-mono whitespace-pre-wrap">
                {JSON.stringify(queryResult.data, null, 2)}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>BigQuery Configuration</CardTitle>
          <CardDescription>Current BigQuery setup information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Project ID:</span>
              <span className="font-mono">cloud-billed-1</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Dataset:</span>
              <span className="font-mono">TestCaseData1</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Location:</span>
              <span className="font-mono">US</span>
            </div>
          </div>

          <div className="mt-4 p-3 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Available Tables:</strong>
            </p>
            <ul className="mt-2 space-y-1 text-sm">
              <li>• <span className="font-mono">synthetic_data</span> - AI-generated test data</li>
              <li>• <span className="font-mono">test_cases</span> - Test cases and scenarios</li>
              <li>• <span className="font-mono">requirements</span> - Project requirements</li>
              <li>• <span className="font-mono">projects</span> - Project metadata</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}