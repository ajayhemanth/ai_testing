import { NextRequest } from 'next/server'
import { progressStore } from '@/lib/progress-store'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: documentId } = await params

  if (!documentId) {
    return new Response('Invalid document ID', { status: 400 })
  }

  // Create a TransformStream for SSE
  const encoder = new TextEncoder()
  let unsubscribe: (() => void) | null = null

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection message
      controller.enqueue(encoder.encode(': connected\n\n'))
      console.log(`[SSE] Connection established for document: ${documentId}`)

      // Send any existing updates
      const existingUpdates = progressStore.getUpdates(documentId)
      console.log(`[SSE] Sending ${existingUpdates.length} existing updates for documentId: ${documentId}`)
      console.log('[SSE] First few updates:', existingUpdates.slice(0, 3))
      existingUpdates.forEach(update => {
        const data = `data: ${JSON.stringify(update)}\n\n`
        controller.enqueue(encoder.encode(data))
      })

      // Subscribe to new updates
      unsubscribe = progressStore.subscribe(documentId, (update) => {
        try {
          console.log(`[SSE] Sending real-time update for ${documentId}:`, update.step, update.status)
          const data = `data: ${JSON.stringify(update)}\n\n`
          controller.enqueue(encoder.encode(data))

          // Close stream when processing is complete
          if (update.status === 'completed' && update.step === 'complete') {
            setTimeout(() => {
              controller.close()
            }, 1000)
          }
        } catch (error) {
          console.error('Error sending SSE update:', error)
        }
      })

      // Send heartbeat every 30 seconds to keep connection alive
      const heartbeatInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': heartbeat\n\n'))
        } catch (error) {
          clearInterval(heartbeatInterval)
        }
      }, 30000)

      // Cleanup on close
      request.signal.addEventListener('abort', () => {
        clearInterval(heartbeatInterval)
        if (unsubscribe) {
          unsubscribe()
        }
        controller.close()
      })
    },
    cancel() {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
      'Access-Control-Allow-Origin': '*',
    },
  })
}