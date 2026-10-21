# cache-nomad

A dead-simple, local-first syncing library that handles offline state, optimistic updates, and background syncing without the bloat of a massive framework.

Keeping data accurate and fast across an application is notoriously difficult. Developers constantly struggle with sync lag, offline states, and race conditions. **cache-nomad** escapes the complexity trap by moving the source of truth to the client device. 

Your data travels with the user, functions independently offline, and syncs up whenever it finds a connection.

## Features

* **Instant Reads (Stale-While-Revalidate):** UI renders instantly from local storage while fetching fresh data in the background.
* **Optimistic UI:** State updates immediately on the client before the server confirms the change.
* **Offline-First Action Queue:** Network requests are queued when offline and automatically processed when `navigator.onLine` is restored.
* **Cross-Tab Sync:** Automatically syncs state across multiple browser tabs in real-time.
* **Native React Hook:** Comes with a built-in `useNomad` hook for seamless React integration.
* **Zero Dependencies:** A tiny, framework-agnostic vanilla TypeScript core.

## Installation

```bash
npm install cache-nomad

```

## Usage: React (v1.5.0+)

`cache-nomad` includes a native React adapter that handles all the subscription lifecycle events for you.

First, register how your app talks to your backend (do this once, e.g., in `App.tsx` or `index.ts`):

```tsx
import { nomad } from 'cache-nomad';

// Tell Nomad how to save data to your server
nomad.registerAction('SAVE_NOTE', async (payload) => {
  const response = await fetch('/api/notes', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  if (!response.ok) throw new Error('Failed to save note');
});

```

Then, use the `useNomad` hook inside any component:

```tsx
import { useNomad } from 'cache-nomad/react';

// A simple fetcher function for background updates
const fetchNotes = () => fetch('/api/notes').then(r => r.json());

export function NotesApp() {
  // 1. Automatically serves cached data instantly, then fetches fresh data in background
  // 2. Instantly syncs if the user opens the app in another browser tab!
  const { data: notes, mutate } = useNomad('my-notes', fetchNotes);

  const handleAddNote = (text: string) => {
    const newNote = { id: Date.now(), text };
    const optimisticNotes = [...(notes || []), newNote];

    // 3. Instantly updates the UI, and handles the network queue safely in the background
    mutate(
      optimisticNotes, // The data to show the user right now
      'SAVE_NOTE',     // The registered server action to trigger
      newNote          // The payload to send to the server
    );
  };

  return (
    <div>
      {notes?.map(note => <div key={note.id}>{note.text}</div>)}
      <button onClick={() => handleAddNote('Hello World!')}>Add Note</button>
    </div>
  );
}

```

## Usage: Vanilla JS / Framework-Agnostic

If you aren't using React, you can use the core `nomad` singleton directly to power Vanilla JS, Vue, Svelte, or any other web environment.

```typescript
import { nomad } from 'cache-nomad';

// 1. Register backend actions
nomad.registerAction('UPDATE_USER', async (payload) => {
  await fetch('/api/user', { method: 'PUT', body: JSON.stringify(payload) });
});

// 2. Subscribe a UI component to a cache key (auto-updates across tabs!)
const unsubscribe = nomad.subscribe('current-user', (user) => {
  document.getElementById('username').innerText = user.name;
});

// 3. Query data (returns local cache instantly, fetches fresh in background)
const user = await nomad.query('current-user', fetchUserFromServer);

// 4. Mutate data optimistically
document.getElementById('save-btn').addEventListener('click', () => {
  const newName = 'Alice';
  
  nomad.mutate(
    'current-user',         // Cache key
    { name: newName },      // Optimistic data
    'UPDATE_USER',          // Server action name
    { name: newName }       // Server payload
  );
});

```

## How It Works

1. **The Cache:** Data is stored in memory and persisted to `localStorage`. `query()` always returns this local data first so your app never blocks the main thread waiting for a network response.
2. **The Queue:** When you call `mutate()`, the new state is saved locally, and an Action is pushed to an offline queue.
3. **The Sync:** If the user is online, the queue is processed immediately. If they are offline, the queue sleeps in `localStorage`. When the browser fires the `window.ononline` event, the queue wakes up and processes the pending actions in the exact order they were triggered.
4. **Cross-Tab Magic:** If a mutation happens in one tab, the `window.onstorage` event instantly wakes up all other tabs running `cache-nomad` and syncs their UI states seamlessly.

## Contributing

We welcome contributions! Please see CONTRIBUTING.md for details on how to set up the repository, run tests, and submit Pull Requests.

## License

MIT

---

<p align="center">
<strong>A Sabtain Ali production</strong>
</p>