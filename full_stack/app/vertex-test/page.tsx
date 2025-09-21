'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function VertexTestPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    agent: string | null;
    response: string;
    sessionId: string;
    userId: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runTest = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/vertex-ai/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to connect to Vertex AI');
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Vertex AI Test (Matching test_one_agent.py)</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Test Connection</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            This will send the same query as test_one_agent.py: "Generate test cases for patient login form"
          </p>
          <Button onClick={runTest} disabled={loading}>
            {loading ? 'Running...' : 'Run Test'}
          </Button>
        </CardContent>
      </Card>

      {error && (
        <Card className="mb-6 border-red-500">
          <CardHeader>
            <CardTitle className="text-red-500">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-sm">{error}</pre>
          </CardContent>
        </Card>
      )}

      {result && (
        <Card className="border-green-500">
          <CardHeader>
            <CardTitle className="text-green-500">Success!</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <strong>Agent:</strong> {result.agent || 'No agent name'}
              </div>
              <div>
                <strong>Session ID:</strong> {result.sessionId}
              </div>
              <div>
                <strong>User ID:</strong> {result.userId}
              </div>
              <div>
                <strong>Response:</strong>
                <pre className="mt-2 whitespace-pre-wrap bg-gray-100 p-4 rounded">
                  {result.response}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}