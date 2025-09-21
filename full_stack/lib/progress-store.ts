// In-memory store for tracking document processing progress
// In production, use Redis or similar

interface ProgressUpdate {
  documentId: string
  step: string
  status: 'processing' | 'completed' | 'error'
  current?: number
  total?: number
  message?: string
  details?: any
  timestamp: number
}

class ProgressStore {
  private updates: Map<string, ProgressUpdate[]> = new Map()
  private listeners: Map<string, ((update: ProgressUpdate) => void)[]> = new Map()

  addUpdate(documentId: string, update: Omit<ProgressUpdate, 'documentId' | 'timestamp'>) {
    const fullUpdate: ProgressUpdate = {
      ...update,
      documentId,
      timestamp: Date.now()
    }

    // Store update
    if (!this.updates.has(documentId)) {
      this.updates.set(documentId, [])
    }
    this.updates.get(documentId)!.push(fullUpdate)

    // Notify listeners
    const listeners = this.listeners.get(documentId) || []
    listeners.forEach(listener => listener(fullUpdate))

    // Log progress
    console.log(`[Progress] ${documentId}: ${update.step} - ${update.message}`)

    // Clean up old updates after 10 minutes
    setTimeout(() => {
      this.cleanupOldUpdates(documentId)
    }, 10 * 60 * 1000)
  }

  subscribe(documentId: string, listener: (update: ProgressUpdate) => void) {
    if (!this.listeners.has(documentId)) {
      this.listeners.set(documentId, [])
    }
    this.listeners.get(documentId)!.push(listener)

    // Return unsubscribe function
    return () => {
      const listeners = this.listeners.get(documentId)
      if (listeners) {
        const index = listeners.indexOf(listener)
        if (index > -1) {
          listeners.splice(index, 1)
        }
        if (listeners.length === 0) {
          this.listeners.delete(documentId)
        }
      }
    }
  }

  getUpdates(documentId: string, since?: number): ProgressUpdate[] {
    console.log(`[ProgressStore] Getting updates for: ${documentId}`)
    console.log(`[ProgressStore] Available documentIds:`, Array.from(this.updates.keys()))
    const updates = this.updates.get(documentId) || []
    console.log(`[ProgressStore] Found ${updates.length} updates for ${documentId}`)
    if (since) {
      return updates.filter(u => u.timestamp > since)
    }
    return updates
  }

  clearUpdates(documentId: string) {
    this.updates.delete(documentId)
    this.listeners.delete(documentId)
  }

  private cleanupOldUpdates(documentId: string) {
    const updates = this.updates.get(documentId)
    if (updates && updates.length > 0) {
      const lastUpdate = updates[updates.length - 1]
      // Only cleanup if last update was completed/error and no active listeners
      if ((lastUpdate.status === 'completed' || lastUpdate.status === 'error')
          && (!this.listeners.has(documentId) || this.listeners.get(documentId)!.length === 0)) {
        this.updates.delete(documentId)
      }
    }
  }
}

// Create singleton instance that persists across hot reloads
let globalProgressStore: ProgressStore

if (typeof window === 'undefined') {
  // Server-side: use global to persist across hot reloads
  if (!(global as any).__progressStore) {
    (global as any).__progressStore = new ProgressStore()
  }
  globalProgressStore = (global as any).__progressStore
} else {
  // Client-side (shouldn't happen for this module)
  globalProgressStore = new ProgressStore()
}

export const progressStore = globalProgressStore
export type { ProgressUpdate }