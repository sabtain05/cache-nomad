# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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