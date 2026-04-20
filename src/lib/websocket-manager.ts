// WebSocket Manager
// Provides an auto-reconnecting WebSocket connection with exponential backoff,
// keep-alive pinging, and a typed message-routing API.  Configure once with
// `wsManager.configure(...)` and call `wsManager.connect()` to open the socket.

export interface WSMessage {
  type: string;
  payload?: unknown;
}

export type WSListener = (msg: WSMessage) => void;

export interface WSConfig {
  /** Full WebSocket URL (ws:// or wss://) */
  url: string;
  /** Initial reconnect delay in ms (default 1 000, doubles up to maxReconnectMs) */
  reconnectMs?: number;
  /** Maximum reconnect delay cap in ms (default 30 000) */
  maxReconnectMs?: number;
  /** Keep-alive ping interval in ms (default 25 000) */
  pingIntervalMs?: number;
}

class WebSocketManager {
  private ws: WebSocket | null = null;
  private config: WSConfig | null = null;
  private listeners = new Map<string, Set<WSListener>>();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private reconnectDelay = 1_000;
  private intentionallyClosed = false;

  // ── Public API ────────────────────────────────────────────────────────────

  configure(config: WSConfig): void {
    this.config = config;
    this.reconnectDelay = config.reconnectMs ?? 1_000;
  }

  connect(): void {
    if (!this.config) {
      console.warn("[WSManager] Call configure() before connect()");
      return;
    }
    if (this.ws?.readyState === WebSocket.OPEN) return;
    this.intentionallyClosed = false;
    this.open();
  }

  disconnect(): void {
    this.intentionallyClosed = true;
    this.clearTimers();
    this.ws?.close();
    this.ws = null;
  }

  send(msg: WSMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    } else {
      console.warn("[WSManager] Cannot send — socket is not open", this.state);
    }
  }

  /**
   * Register a listener for a specific message type.
   * Use `"*"` to receive all messages.
   * Returns an unsubscribe function.
   */
  on(type: string, listener: WSListener): () => void {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type)!.add(listener);
    return () => this.listeners.get(type)?.delete(listener);
  }

  get state(): "connected" | "connecting" | "disconnected" {
    if (!this.ws) return "disconnected";
    if (this.ws.readyState === WebSocket.CONNECTING) return "connecting";
    if (this.ws.readyState === WebSocket.OPEN) return "connected";
    return "disconnected";
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private open(): void {
    if (!this.config) return;
    try {
      this.ws = new WebSocket(this.config.url);

      this.ws.onopen = () => {
        this.reconnectDelay = this.config?.reconnectMs ?? 1_000;
        this.startPing();
        this.dispatch({ type: "__connected__" });
      };

      this.ws.onmessage = (e: MessageEvent) => {
        try {
          const msg: WSMessage = JSON.parse(e.data as string);
          this.dispatch(msg);
        } catch {
          // malformed frame — ignore
        }
      };

      this.ws.onclose = () => {
        this.clearTimers();
        this.dispatch({ type: "__disconnected__" });
        if (!this.intentionallyClosed) this.scheduleReconnect();
      };

      this.ws.onerror = () => {
        // onerror always precedes onclose; let onclose handle the reconnect
        this.ws?.close();
      };
    } catch {
      // Invalid URL or WebSocket not supported
      console.error("[WSManager] Failed to create WebSocket", this.config.url);
    }
  }

  private dispatch(msg: WSMessage): void {
    this.listeners.get(msg.type)?.forEach((l) => l(msg));
    this.listeners.get("*")?.forEach((l) => l(msg));
  }

  private scheduleReconnect(): void {
    const max = this.config?.maxReconnectMs ?? 30_000;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectDelay = Math.min(this.reconnectDelay * 2, max);
      this.open();
    }, this.reconnectDelay);
  }

  private startPing(): void {
    const interval = this.config?.pingIntervalMs ?? 25_000;
    this.pingTimer = setInterval(() => this.send({ type: "__ping__" }), interval);
  }

  private clearTimers(): void {
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.pingTimer !== null) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }
}

export const wsManager = new WebSocketManager();
