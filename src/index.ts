export interface StorageAdapter {
  get(key: string): Promise<any>;
  set(key: string, value: any): Promise<void>;
  remove(key: string): Promise<void>;
}

export interface QueuedAction {
  id: string;
  action: string;
  payload: any;
  cacheKey: string;
  rollbackData: any;
  timestamp: number;
  priority: number;  
  attempts: number; 
}

interface CacheItem {
  data: any;
  updatedAt: number;
  ttl?: number; 
}

type ActionHandler = (payload: any) => Promise<any>;
type Listener = (data: any) => void;
type Interceptor = (action: QueuedAction) => Promise<QueuedAction | null>;

export class CacheNomad {
  private cache: Record<string, CacheItem> = {};
  private queue: QueuedAction[] = [];
  private actionHandlers: Record<string, ActionHandler> = {};
  private subscribers: Record<string, Set<Listener>> = {};

  private storage: StorageAdapter;
  private interceptors: { beforeProcess: Interceptor[] } = { beforeProcess: [] };
  private isProcessing = false;

  constructor(storageAdapter: StorageAdapter) {
    this.storage = storageAdapter;
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.processQueue());
      window.addEventListener('storage', () => this.hydrate());
    }
  }

  async init() {
    await this.hydrate();
  }

  registerAction(actionName: string, handler: ActionHandler) {
    this.actionHandlers[actionName] = handler;
  }

  addInterceptor(fn: Interceptor) {
    this.interceptors.beforeProcess.push(fn);
  }
  connectRealtimeStream(socket: WebSocket | EventSource) {
    socket.addEventListener('message', (event) => {
      const { key, data, timestamp } = JSON.parse(event.data);
      const local = this.cache[key];
      if (!local || timestamp > local.updatedAt) {
        this.set(key, data, undefined, timestamp);
      }
    });
  }


  async query(key: string, fetcher?: () => Promise<any>, ttlMs?: number) {
    const item = this.cache[key];
    
    if (item && item.ttl && Date.now() - item.updatedAt > item.ttl) {
      delete this.cache[key];
      await this.persist();
    } else if (item) {
      if (fetcher && navigator.onLine) {
        fetcher().then(data => this.set(key, data, ttlMs)).catch(console.error);
      }
      return item.data;
    }

    if (fetcher && navigator.onLine) {
      const data = await fetcher();
      await this.set(key, data, ttlMs);
      return data;
    }
    return undefined;
  }

  async mutate(
    cacheKey: string, 
    optimisticData: any, 
    actionName: string, 
    payload: any, 
    options: { priority?: number; ttl?: number } = {}
  ) {
    const rollbackData = this.cache[cacheKey]?.data;
    await this.set(cacheKey, optimisticData, options.ttl);

    this.queue.push({
      id: typeof crypto !== 'undefined' ? crypto.randomUUID() : Math.random().toString(),
      action: actionName,
      payload,
      cacheKey,
      rollbackData,
      timestamp: Date.now(),
      priority: options.priority || 0,
      attempts: 0
    });
    
    this.queue.sort((a, b) => b.priority - a.priority);
    await this.persist();
    this.processQueue();
  }

  subscribe(key: string, listener: Listener): () => void {
    if (!this.subscribers[key]) this.subscribers[key] = new Set();
    this.subscribers[key].add(listener);
    if (this.cache[key] && !this.isExpired(this.cache[key])) {
      listener(this.cache[key].data);
    }
    return () => this.subscribers[key].delete(listener);
  }

  private isExpired(item: CacheItem) {
    return item.ttl ? Date.now() - item.updatedAt > item.ttl : false;
  }

  private async set(key: string, data: any, ttl?: number, customTimestamp?: number) {
    this.cache[key] = {
      data,
      updatedAt: customTimestamp || Date.now(),
      ttl: ttl || this.cache[key]?.ttl
    };
    await this.persist();
    if (this.subscribers[key]) {
      this.subscribers[key].forEach(listener => listener(data));
    }
  }

  private async processQueue() {
    if (this.isProcessing || typeof navigator !== 'undefined' && !navigator.onLine) return;
    if (this.queue.length === 0) return;

    this.isProcessing = true;
    let action = this.queue[0];
    const handler = this.actionHandlers[action.action];

    if (handler) {
      try {
        for (const interceptor of this.interceptors.beforeProcess) {
          const modified = await interceptor(action);
          if (!modified) {
             this.queue.shift();
             return this.resumeQueue();
          }
          action = modified;
        }

        await handler(action.payload);

        this.queue.shift();
        await this.persist();
        
      } catch (err: any) {
        action.attempts += 1;
        
        if (err.status >= 400 && err.status < 500) {
          console.warn(`Nomad: Permanent failure. Rolling back ${action.cacheKey}`);
          await this.set(action.cacheKey, action.rollbackData);
          this.queue.shift();
        } else {
          const backoff = Math.min(Math.pow(2, action.attempts) * 1000, 30000);
          console.warn(`Nomad: Network error. Retrying in ${backoff}ms...`);
          await new Promise(res => setTimeout(res, backoff));
        }
        await this.persist();
      }
    }
    this.resumeQueue();
  }

  private resumeQueue() {
    this.isProcessing = false;
    if (this.queue.length > 0) this.processQueue();
  }

  private async persist() {
    await this.storage.set('cache-nomad-data', JSON.stringify({ cache: this.cache, queue: this.queue }));
  }

  private async hydrate() {
    const stored = await this.storage.get('cache-nomad-data');
    if (stored) {
      const { cache, queue } = JSON.parse(stored);
      this.cache = cache || {};
      this.queue = queue || [];
      
      for (const key in this.cache) {
        if (this.isExpired(this.cache[key])) delete this.cache[key];
      }
    }
  }
}