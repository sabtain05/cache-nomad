# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.0.0] - 2026-11-02

### Added
- **Pluggable Storage Adapters:** Switched from hardcoded `localStorage` to an async adapter pattern.
- **IndexedDB Adapter:** Exported a native `IndexedDBAdapter` to handle hundreds of megabytes of offline data without blocking the UI thread.
- **Middleware Interceptors:** Added `nomad.addInterceptor()` to modify queued actions (like injecting auth tokens) right before they process.
- **Automatic Rollbacks:** Optimistic mutations now automatically revert to the previous known-good state if the server responds with a 4xx error.
- **Exponential Backoff:** Failed network requests now automatically retry with exponential delays (1s, 2s, 4s, etc.) to prevent server overload.
- **Queue Prioritization:** Added a `priority` flag to `mutate()` options to ensure critical actions process before background tasks.
- **Garbage Collection (TTL):** Added a `ttl` option to query and mutate. Expired cache data is now automatically purged on startup.
- **Real-Time WebSocket Bridge:** Added `connectRealtimeStream()` to support Last-Write-Wins CRDT-style syncing from Server-Sent Events or WebSockets.

### Changed (Breaking)
- **Async Initialization:** You must now pass a storage adapter to the constructor (e.g., `new CacheNomad(new IndexedDBAdapter())`) and await `nomad.init()` before querying data.
- **React Adapter API:** The `useNomad` hook now requires passing the instantiated `nomad` object as its first argument, and exports an `isReady` boolean to track async storage initialization.

## [1.6.0] - 2026-10-21

### Added
- **Cross-Tab Synchronization:** Automatically syncs state across multiple browser tabs in real-time using the native `StorageEvent` API.

## [1.5.0] - 2026-10-17

### Added
- **React Adapter:** Introduced the `useNomad` hook for native, seamless integration with React applications.
- **Subpath Exports:** Configured `package.json` exports to allow clean imports of framework adapters (e.g., `import { useNomad } from 'cache-nomad/react'`).
- **Peer Dependencies:** Added `react` as a peer dependency to ensure type safety and compatibility without bloating the core Vanilla JS package.

## [1.0.1] - 2026-10-15

### Added
- **Core Engine:** Initial release of the `CacheNomad` class.
- **Data Fetching:** `query()` method utilizing a stale-while-revalidate strategy for instant reads.
- **Optimistic UI:** `mutate()` method for instant local cache updates.
- **Offline Support:** Automatic action queueing when `navigator.onLine` is false.
- **Background Sync:** Automatic queue processing upon reconnection to the network.
- **Reactivity:** `subscribe()` method to listen for cache changes and update UI components.
- **Persistence:** Automatic hydration and storage of cache and queues via `localStorage`.
- **Backend Integration:** `registerAction()` to define how queued actions communicate with the server.
- **Type Safety:** Full TypeScript support and exported type definitions.