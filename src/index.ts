type Listener = (data: any) => void;
type ActionHandler = (payload: any) => Promise<any>;

interface QueuedAction {
  id: string;
  action: string;
  payload: any;
  timestamp: number;
}

export class CacheNomad {
  private cache: Record<string, any> = {};
  private subscribers: Record<string, Set<Listener>> = {};
  private queue: QueuedAction[] = [];
  private actionHandlers: Record<string, ActionHandler> = {};
  private storageKey = 'cache-nomad-data';

  constructor() {
    this.hydrate();
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.processQueue());
      window.addEventListener('storage', (e) => this.handleStorageChange(e));
    }
  }

  registerAction(actionName: string, handler: ActionHandler) {
    this.actionHandlers[actionName] = handler;
  }

  async query(key: string, fetcher: () => Promise<any>) {
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      fetcher().then((data) => this.set(key, data)).catch(console.error);
    }
    return this.cache[key];
  }

  mutate(cacheKey: string, optimisticData: any, actionName: string, payload: any) {
    this.set(cacheKey, optimisticData);
    this.queue.push({
      id: typeof crypto !== 'undefined' ? crypto.randomUUID() : Math.random().toString(),
      action: actionName,
      payload,
      timestamp: Date.now()
    });
    this.persist();
    this.processQueue();
  }

  subscribe(key: string, listener: Listener): () => void {
    if (!this.subscribers[key]) this.subscribers[key] = new Set();
    this.subscribers[key].add(listener);
    if (this.cache[key] !== undefined) listener(this.cache[key]);
    return () => this.subscribers[key].delete(listener);
  }

  private set(key: string, data: any) {
    this.cache[key] = data;
    this.persist();
    this.notifySubscribers(key);
  }

  private notifySubscribers(key: string) {
    if (this.subscribers[key] && this.cache[key] !== undefined) {
      this.subscribers[key].forEach(listener => listener(this.cache[key]));
    }
  }

  private handleStorageChange(event: StorageEvent) {
    if (event.key === this.storageKey && event.newValue) {
      try {
        const { cache, queue } = JSON.parse(event.newValue);
        this.cache = cache || {};
        this.queue = queue || [];
        
        Object.keys(this.subscribers).forEach((key) => {
          this.notifySubscribers(key);
        });
      } catch (err) {
        console.error('CacheNomad: Failed to sync across tabs', err);
      }
    }
  }

  private async processQueue() {
    if (typeof navigator !== 'undefined' && (!navigator.onLine || this.queue.length === 0)) return;
    if (this.queue.length === 0) return;

    const action = this.queue[0];
    const handler = this.actionHandlers[action.action];

    if (handler) {
      try {
        await handler(action.payload);
        this.queue.shift();
        this.persist();
        this.processQueue();
      } catch (err) {
        console.error(`CacheNomad: Action ${action.action} failed. Will retry.`, err);
      }
    }
  }

  private persist() {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.storageKey, JSON.stringify({
        cache: this.cache,
        queue: this.queue
      }));
    }
  }

  private hydrate() {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const { cache, queue } = JSON.parse(stored);
        this.cache = cache || {};
        this.queue = queue || [];
      }
    }
  }
}

export const nomad = new CacheNomad();