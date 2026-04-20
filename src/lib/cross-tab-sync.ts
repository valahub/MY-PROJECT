// Cross-Tab Synchronization
// Uses the BroadcastChannel API (all modern browsers + Workers) to propagate
// events across tabs that share the same origin.  Falls back to a
// localStorage-event approach for environments where BroadcastChannel is not
// available.

export interface CrossTabMessage {
  /** Logical event type — consumer-defined (e.g. "cart.updated") */
  type: string;
  payload?: unknown;
  /** Originating tab ID — recipients skip messages from themselves */
  origin: string;
  /** Unix timestamp (ms) */
  ts: number;
}

const TAB_ID = `tab_${Math.random().toString(36).slice(2)}`;
const CHANNEL_NAME = "vala_cross_tab";

type TabListener = (msg: CrossTabMessage) => void;

class CrossTabSync {
  private channel: BroadcastChannel | null = null;
  private listeners: TabListener[] = [];
  /** localStorage key used for the fallback */
  private readonly storageKey = `${CHANNEL_NAME}_latest`;

  constructor() {
    if (typeof window === "undefined") return;
    this.init();
  }

  private init(): void {
    if (typeof BroadcastChannel !== "undefined") {
      this.channel = new BroadcastChannel(CHANNEL_NAME);
      this.channel.onmessage = (e: MessageEvent<CrossTabMessage>) => {
        if (e.data?.origin !== TAB_ID) this.dispatch(e.data);
      };
    } else {
      // Fallback: broadcast via storage events
      (window as Window).addEventListener("storage", (e: StorageEvent) => {
        if (e.key === this.storageKey && e.newValue) {
          try {
            const msg: CrossTabMessage = JSON.parse(e.newValue);
            if (msg.origin !== TAB_ID) this.dispatch(msg);
          } catch {
            // malformed payload — ignore
          }
        }
      });
    }
  }

  /** Broadcast a message to all other tabs. */
  publish(type: string, payload?: unknown): void {
    const msg: CrossTabMessage = {
      type,
      payload,
      origin: TAB_ID,
      ts: Date.now(),
    };
    if (this.channel) {
      this.channel.postMessage(msg);
    } else {
      try {
        localStorage.setItem(this.storageKey, JSON.stringify(msg));
      } catch {
        // localStorage not available (private browsing, etc.)
      }
    }
  }

  /** Subscribe to messages from other tabs. Returns an unsubscribe function. */
  subscribe(listener: TabListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private dispatch(msg: CrossTabMessage): void {
    this.listeners.forEach((l) => l(msg));
  }

  /** The unique ID of the current tab. */
  get tabId(): string {
    return TAB_ID;
  }

  /** Tear down the channel (call on app unmount if needed). */
  close(): void {
    this.channel?.close();
    this.channel = null;
  }
}

export const crossTabSync = new CrossTabSync();
