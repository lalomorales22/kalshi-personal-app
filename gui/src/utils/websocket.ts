/**
 * WebSocket service for real-time Kalshi market data.
 * Handles connection, subscriptions, and message broadcasting.
 */

type MessageCallback = (data: any) => void;

interface Subscription {
  channels: string[];
  market_tickers?: string[];
}

class WebSocketService {
  private ws: WebSocket | null = null;
  private url: string = 'ws://localhost:8000/ws';
  private reconnectDelay: number = 1000;
  private maxReconnectDelay: number = 30000;
  private callbacks: Map<string, Set<MessageCallback>> = new Map();
  private activeSubscriptions: Subscription[] = [];
  private reconnectAttempt: number = 0;

  /**
   * Connect to WebSocket server
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        console.log('🔌 Connecting to WebSocket...');
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          console.log('✅ WebSocket connected!');
          this.reconnectDelay = 1000;
          this.reconnectAttempt = 0;

          // Resubscribe to previous subscriptions
          this.resubscribe();

          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('❌ Failed to parse WebSocket message:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('❌ WebSocket error:', error);
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('⚠️ WebSocket disconnected');
          this.scheduleReconnect();
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(message: any) {
    const type = message.type;

    if (type === 'subscribed' || type === 'unsubscribed') {
      console.log(`📡 ${type}:`, message.channels);
      return;
    }

    // Trigger callbacks for this message type
    const callbacks = this.callbacks.get(type);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(message.data || message);
        } catch (error) {
          console.error(`❌ Error in callback for ${type}:`, error);
        }
      });
    }
  }

  /**
   * Subscribe to WebSocket channels
   */
  subscribe(channels: string[], market_tickers?: string[]): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('⚠️ WebSocket not connected. Will subscribe on connect.');
      this.activeSubscriptions.push({ channels, market_tickers });
      return;
    }

    const message = {
      command: 'subscribe',
      channels,
      market_tickers
    };

    this.ws.send(JSON.stringify(message));
    this.activeSubscriptions.push({ channels, market_tickers });

    console.log(`📡 Subscribing to:`, channels, market_tickers || '');
  }

  /**
   * Unsubscribe from WebSocket channels
   */
  unsubscribe(channels: string[], market_tickers?: string[]): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    const message = {
      command: 'unsubscribe',
      channels,
      market_tickers
    };

    this.ws.send(JSON.stringify(message));

    // Remove from active subscriptions
    this.activeSubscriptions = this.activeSubscriptions.filter(
      sub => !channels.every(ch => sub.channels.includes(ch))
    );

    console.log(`🔕 Unsubscribing from:`, channels);
  }

  /**
   * Resubscribe to all active subscriptions (after reconnect)
   */
  private resubscribe(): void {
    if (this.activeSubscriptions.length === 0) return;

    console.log('🔄 Resubscribing to active channels...');
    const subs = [...this.activeSubscriptions];
    this.activeSubscriptions = [];

    subs.forEach(({ channels, market_tickers }) => {
      this.subscribe(channels, market_tickers);
    });
  }

  /**
   * Schedule reconnection with exponential backoff
   */
  private scheduleReconnect(): void {
    this.reconnectAttempt++;
    const delay = Math.min(
      this.reconnectDelay * Math.pow(2, this.reconnectAttempt - 1),
      this.maxReconnectDelay
    );

    console.log(`🔄 Reconnecting in ${delay / 1000}s...`);

    setTimeout(() => {
      this.connect().catch(error => {
        console.error('❌ Reconnection failed:', error);
      });
    }, delay);
  }

  /**
   * Register a callback for specific message type
   */
  on(type: string, callback: MessageCallback): () => void {
    if (!this.callbacks.has(type)) {
      this.callbacks.set(type, new Set());
    }

    this.callbacks.get(type)!.add(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.callbacks.get(type);
      if (callbacks) {
        callbacks.delete(callback);
      }
    };
  }

  /**
   * Remove all callbacks for a message type
   */
  off(type: string): void {
    this.callbacks.delete(type);
  }

  /**
   * Close WebSocket connection
   */
  close(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Check if WebSocket is connected
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

// Export singleton instance
export const websocket = new WebSocketService();

// Auto-connect on module load
websocket.connect().catch(error => {
  console.warn('⚠️ Initial WebSocket connection failed:', error);
  console.log('   Will auto-retry...');
});
