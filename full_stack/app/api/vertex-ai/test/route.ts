import { NextResponse } from 'next/server';
import { getAccessToken } from '@/lib/google-auth';

// Match test_one_agent.py configuration
const PROJECT_ID = "cloud-billed-1";
const LOCATION = "us-central1";
const ENGINE_ID = "6580291219216138240"; // Same as test_one_agent.py

export async function POST(request: Request) {
  try {
    // Get access token
    const accessToken = await getAccessToken();

    // Generate unique user ID
    const userId = `u_${Date.now()}`;

    // Base URL for API calls
    const baseUrl = `https://${LOCATION}-aiplatform.googleapis.com/v1beta1/projects/${PROJECT_ID}/locations/${LOCATION}/reasoningEngines/${ENGINE_ID}`;

    // Step 1: Create session (matches remote_app.async_create_session)
    const createSessionResponse = await fetch(`${baseUrl}:query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        class_method: 'async_create_session',
        input: { user_id: userId }
      }),
    });

    if (!createSessionResponse.ok) {
      const errorText = await createSessionResponse.text();
      console.error('Create session error:', errorText);
      throw new Error(`Failed to create session: ${createSessionResponse.statusText}`);
    }

    const sessionData = await createSessionResponse.json();

    // Extract session ID
    let sessionId = '';
    if (sessionData.output && typeof sessionData.output === 'object') {
      sessionId = sessionData.output.id || sessionData.output.session_id || '';
    } else if (sessionData.id) {
      sessionId = sessionData.id;
    }

    if (!sessionId) {
      throw new Error('No session ID received');
    }

    console.log('Created session:', sessionId);

    // Step 2: Send query (matches remote_app.async_stream_query)
    const query = "Generate test cases for patient login form"; // Same query as test_one_agent.py

    const queryResponse = await fetch(`${baseUrl}:streamQuery`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        class_method: 'async_stream_query',
        input: {
          user_id: userId,
          session_id: sessionId,
          message: query
        }
      }),
    });

    if (!queryResponse.ok) {
      const errorText = await queryResponse.text();
      console.error('Query error:', errorText);
      throw new Error(`Failed to query: ${queryResponse.statusText}`);
    }

    // Parse NDJSON response
    const responseText = await queryResponse.text();
    const jsonLines = responseText.trim().split('\n').filter(line => line.trim());

    let agentName: string | null = null;
    let responseContent = '';

    // Process each line (matches the event processing in test_one_agent.py)
    for (const line of jsonLines) {
      try {
        const event = JSON.parse(line);

        if (event.content && event.content.parts) {
          for (const part of event.content.parts) {
            // Check for function_response (agent output)
            if (part.function_response) {
              agentName = part.function_response.name || null;
              const response = part.function_response.response;
              if (response && typeof response === 'object' && 'result' in response) {
                responseContent = response.result;
                break;
              }
            }
            // Also check for text responses
            else if (part.text && !responseContent) {
              responseContent += part.text;
            }
          }
        }
      } catch (e) {
        console.error('Failed to parse JSON line:', e);
      }
    }

    // Step 3: Clean up session (matches remote_app.async_delete_session)
    const deleteResponse = await fetch(`${baseUrl}:query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        class_method: 'async_delete_session',
        input: {
          user_id: userId,
          session_id: sessionId
        }
      }),
    });

    if (!deleteResponse.ok) {
      console.error('Failed to delete session, but continuing');
    }

    // Return response matching test_one_agent.py output format
    return NextResponse.json({
      agent: agentName,
      response: responseContent || 'No response received',
      sessionId: sessionId,
      userId: userId
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process request' },
      { status: 500 }
    );
  }
}