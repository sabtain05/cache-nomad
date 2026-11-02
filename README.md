# cache-nomad

An enterprise-grade, local-first state management engine built for offline-ready, real-time web applications.

`cache-nomad` shifts your application's source of truth to the client's device. It eliminates network latency spinners, handles offline dropouts gracefully, and syncs seamlessly with your backend using asynchronous storage adapters, optimistic state rollbacks, and priority queues.

---

## Key Features

* **Pluggable Storage Adapters:** Native `IndexedDBAdapter` for storing hundreds of megabytes of offline data without blocking the UI thread, plus a lightweight `LocalStorageAdapter`.
* **Instant Reads & TTL Garbage Collection:** Stale-while-revalidate fetching serves local data instantly, while automatic Time-To-Live (TTL) purges expired records on startup.
* **Optimistic UI & Automatic Rollbacks:** Instant client updates that automatically revert to the previous known-good state if the server rejects a request (e.g., 4xx HTTP errors).
* **Prioritized Queue & Exponential Backoff:** Queued offline actions execute in order of priority when connectivity restores, with exponential retry backoff (1s, 2s, 4s, 8s) on network failures.
* **Middleware Interceptors:** Inject dynamic data (such as fresh authentication tokens or header metadata) into queued actions right before they leave the client.
* **Real-Time & Cross-Tab Sync:** Built-in `StorageEvent` cross-tab synchronization and `connectRealtimeStream()` for WebSocket/SSE Last-Write-Wins CRDT state updates.
* **Native React Hook:** Official `useNomad` hook with asynchronous initialization tracking (`isReady`).
* **Zero Dependencies:** Lightweight, strict TypeScript core.

---

## Installation

```bash
npm install cache-nomad

```

---

## Quick Start (v3.0.0 Architecture)

### 1. Setup Engine Instance (`nomad-setup.ts`)

Instantiate `CacheNomad` with your preferred storage adapter, register backend actions, and optionally add middleware interceptors:

```typescript
import { CacheNomad } from 'cache-nomad';
import { IndexedDBAdapter } from 'cache-nomad/adapters';

// Instantiate with IndexedDB for high-capacity asynchronous storage
export const nomad = new CacheNomad(new IndexedDBAdapter());

// Register backend actions
nomad.registerAction('SAVE_NOTE', async (payload) => {
  const response = await fetch('/api/notes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    const error = new Error('Failed to save');
    (error as any).status = response.status; // Triggers auto-rollback on 4xx
    throw error;
  }
});

// Middleware interceptor: Inject dynamic Auth token before processing queued actions
nomad.addInterceptor(async (action) => {
  const token = localStorage.getItem('jwt_token');
  if (token) {
    action.payload.token = token;
  }
  return action;
});

```

---

## Usage: React (`useNomad`)

The `useNomad` hook automatically manages asynchronous storage initialization, re-renders on cache changes, and provides an `isReady` state.

```tsx
import React from 'react';
import { useNomad } from 'cache-nomad/react';
import { nomad } from './nomad-setup';

const fetchNotes = async () => {
  const res = await fetch('/api/notes');
  return res.json();
};

export function NotesApp() {
  // Bind component to 'notes-cache' key with a 1-hour TTL (3,600,000 ms)
  const { data: notes, mutate, isReady } = useNomad(
    nomad, 
    'notes-cache', 
    fetchNotes, 
    3600000
  );

  const handleAddNote = () => {
    const newNote = { id: Date.now(), text: 'New offline note' };
    const optimisticList = [...(notes || []), newNote];

    // Mutate local state instantly, queue action with high priority (1)
    mutate(
      optimisticList,  // Optimistic UI state
      'SAVE_NOTE',      // Registered server action
      newNote,          // Server payload
      1                 // Queue priority (default: 0)
    );
  };

  if (!isReady) {
    return <div>Initializing Offline Storage...</div>;
  }

  return (
    <div>
      <h2>My Notes</h2>
      <ul>
        {notes?.map((note: any) => (
          <li key={note.id}>{note.text}</li>
        ))}
      </ul>
      <button onClick={handleAddNote}>Add Note</button>
    </div>
  );
}

```

---

## Usage: Vanilla JS / Framework-Agnostic

For non-React applications (Vue, Svelte, or Vanilla TypeScript), initialize the engine and subscribe directly:

```typescript
import { CacheNomad } from 'cache-nomad';
import { IndexedDBAdapter } from 'cache-nomad/adapters';

const nomad = new CacheNomad(new IndexedDBAdapter());

async function main() {
  // Boot up storage
  await nomad.init();

  // Subscribe to changes
  nomad.subscribe('user-profile', (user) => {
    document.getElementById('username')!.innerText = user.name;
  });

  // Query with stale-while-revalidate
  const user = await nomad.query('user-profile', async () => {
    const res = await fetch('/api/me');
    return res.json();
  });

  // Optimistic update
  document.getElementById('save-btn')!.addEventListener('click', async () => {
    await nomad.mutate('user-profile', { name: 'Alice' }, 'UPDATE_USER', { name: 'Alice' });
  });
}

main();

```

---

## Real-Time Syncing (WebSockets / SSE)

You can connect real-time streams to `CacheNomad`. The engine uses Last-Write-Wins CRDT timestamp ordering to prevent incoming socket messages from overwriting newer local edits:

```typescript
const socket = new WebSocket('wss://[api.yourdomain.com/feed](https://api.yourdomain.com/feed)');

// Automatically sync incoming socket payloads to the cache
nomad.connectRealtimeStream(socket);

```

*Expected socket payload format:*

```json
{
  "key": "notes-cache",
  "data": [{ "id": 1, "text": "Synced note" }],
  "timestamp": 1700000000000
}

```

---

## API Reference

### `CacheNomad`

* **`constructor(adapter: StorageAdapter)`**: Instantiates the engine with an asynchronous storage adapter.
* **`init(): Promise<void>`**: Hydrates state and performs TTL garbage collection. Must be awaited when using raw class instances.
* **`registerAction(name: string, handler: (payload: any) => Promise<any>)`**: Registers server sync handlers.
* **`addInterceptor(fn: (action: QueuedAction) => Promise<QueuedAction | null>)`**: Adds middleware to inspect or modify actions prior to server execution.
* **`query(key: string, fetcher?: () => Promise<any>, ttlMs?: number): Promise<any>`**: Returns local data immediately, then fetches fresh data in the background if online.
* **`mutate(key: string, optimisticData: any, actionName: string, payload: any, options?: { priority?: number; ttl?: number }): Promise<void>`**: Performs an optimistic write and queues a backend request.
* **`subscribe(key: string, listener: (data: any) => void): () => void`**: Listens for cache updates on a specific key.
* **`connectRealtimeStream(socket: WebSocket | EventSource): void`**: Connects real-time events directly to local cache keys using timestamp evaluation.

### Adapters (`cache-nomad/adapters`)

* **`IndexedDBAdapter`**: Default recommended adapter. Uses browser IndexedDB for large-capacity storage.
* **`LocalStorageAdapter`**: Fallback adapter using standard browser `localStorage`.

---

## Contributing

Please see CONTRIBUTING.md for local development setup, testing workflows, and PR requirements.

## License

MIT License © 2026 Sabtain Ali

---

<p align="center">
<strong>A Sabtain Ali production</strong>
</p>