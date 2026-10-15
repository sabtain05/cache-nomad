# cache-nomad

> A dead-simple, local-first syncing library that handles offline state and background updates without the bloat of a massive framework.

[![npm version](https://img.shields.io/npm/v/cache-nomad.svg?style=flat)](https://www.npmjs.com/package/cache-nomad)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Keeping data accurate and fast across an application is notoriously difficult. Developers constantly struggle with sync lag, offline states, and race conditions. `cache-nomad` solves the complexity trap using a lightweight, framework-agnostic approach.

## Features

- **Instant Reads (Stale-While-Revalidate):** Data is served from the local cache instantly, while a background fetch keeps it fresh.
- **Optimistic UI Mutations:** UI updates instantly when a user makes a change. No waiting for network requests.
- **Built-in Offline Support:** Network requests are stored in a local queue. If the user is offline, actions wait safely until `navigator.onLine` fires, then process sequentially.
- **Zero Dependencies:** Written in pure, strict TypeScript.
- **Framework Agnostic:** Use it with Vanilla JS, React, Vue, Svelte, or Angular.

## Installation

```bash
npm install cache-nomad
```

## Quick Start

Because `cache-nomad` handles the offline state and cache persistence internally, you only need to define *how* to talk to your server.

### 1. Register Backend Actions

Tell Nomad how to execute your network requests.

```typescript
import { nomad } from 'cache-nomad';

// Register an action to save data to your server
nomad.registerAction('SAVE_NOTE', async (payload) => {
  const response = await fetch('/api/notes', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  if (!response.ok) throw new Error('Failed to save');
});
```

### 2. Query and Subscribe

Fetch data (with stale-while-revalidate) and listen for changes to update your UI.

```typescript
// Subscribe to a cache key
const unsubscribe = nomad.subscribe('my-notes', (notes) => {
  console.log('Notes updated:', notes);
  // renderUI(notes); 
});

// Fetch data (returns instantly from cache, updates in background)
async function loadNotes() {
  const notes = await nomad.query('my-notes', async () => {
    const res = await fetch('/api/notes');
    return res.json();
  });
}
```

### 3. Mutate Data Optimistically

When a user acts, update the UI instantly and let Nomad handle the network and offline queueing.

```typescript
function handleUserCreatingNote(newNote) {
  // 1. Get current state
  const currentNotes = nomad.query('my-notes', fetchNotesFromServer) || [];
  
  // 2. Prepare optimistic state
  const optimisticNotes = [...currentNotes, newNote];

  // 3. Mutate! 
  nomad.mutate(
    'my-notes',           // The cache key to update instantly
    optimisticNotes,      // The new data to show the user right now
    'SAVE_NOTE',          // The server action to run in the background
    { note: newNote }     // The payload to send to the server
  );
}
```

## API Reference

### `nomad.query(key: string, fetcher: () => Promise<any>): Promise<any>`
Returns data from the local cache instantly (if it exists) while simultaneously running the `fetcher` function in the background to update the cache.

### `nomad.mutate(cacheKey: string, optimisticData: any, actionName: string, payload: any): void`
Instantly updates the local cache for `cacheKey` with `optimisticData`, triggering any subscribers. Simultaneously pushes an action to the offline-safe queue to run `actionName` with `payload`.

### `nomad.subscribe(key: string, listener: (data: any) => void): () => void`
Listens for any changes to a specific `key`. Returns an unsubscribe function.

### `nomad.registerAction(actionName: string, handler: (payload: any) => Promise<any>): void`
Registers a background network handler that Nomad will execute when processing the queue.

## Contributing

Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for details on how to contribute to this project.

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

---

<strong>A Sabtain Ali production</strong>
