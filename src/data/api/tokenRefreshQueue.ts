/**
 * Token Refresh Queue System
 * 
 * Handles queuing of failed requests when a 401 response occurs.
 * Ensures only ONE refresh token request is made even if multiple 
 * API calls fail concurrently.
 * 
 * All queued requests are retried after the refresh completes.
 */

type QueuedRequest = {
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
};

class TokenRefreshQueue {
  private queue: QueuedRequest[] = [];
  private isRefreshing: boolean = false;

  /**
   * Check if a refresh is currently in progress
   */
  isRefreshing_(): boolean {
    return this.isRefreshing;
  }

  /**
   * Mark that a refresh operation has started
   */
  setRefreshing(value: boolean): void {
    this.isRefreshing = value;
  }

  /**
   * Add a request to the queue
   * Returns a promise that resolves when the refresh completes
   */
  addToQueue(): Promise<unknown> {
    return new Promise((resolve, reject) => {
      this.queue.push({ resolve, reject });
    });
  }

  /**
   * Complete all queued requests successfully
   */
  resolveQueue(): void {
    this.queue.forEach(({ resolve }) => resolve(null));
    this.queue = [];
  }

  /**
   * Reject all queued requests with an error
   */
  rejectQueue(error: any): void {
    this.queue.forEach(({ reject }) => reject(error));
    this.queue = [];
  }

  /**
   * Get the current queue size
   */
  getQueueSize(): number {
    return this.queue.length;
  }

  /**
   * Clear the queue (useful for cleanup)
   */
  clear(): void {
    this.queue = [];
    this.isRefreshing = false;
  }
}

export const refreshQueue = new TokenRefreshQueue();
