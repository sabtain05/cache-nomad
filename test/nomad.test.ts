import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CacheNomad } from '../src/index';

describe('CacheNomad', () => {
  let nomad: CacheNomad;

  beforeEach(() => {
    localStorage.clear();
    nomad = new CacheNomad();
  });

  it('should instantly return local data and update subscribers', () => {
    let firedData = null;
    
    nomad.subscribe('user', (data) => {
      firedData = data;
    });

    nomad.mutate('user', { name: 'Alice' }, 'SAVE_USER', { name: 'Alice' });

    expect(firedData).toEqual({ name: 'Alice' });
  });

  it('should queue actions when mutating', () => {
    nomad.mutate('note', { text: 'Hello' }, 'SAVE_NOTE', { text: 'Hello' });
    
    const stored = JSON.parse(localStorage.getItem('cache-nomad-data') || '{}');
    
    expect(stored.cache['note']).toEqual({ text: 'Hello' });
    expect(stored.queue.length).toBe(1);
    expect(stored.queue[0].action).toBe('SAVE_NOTE');
  });

  it('should sync data across tabs when storage event fires', () => {
    let firedData = null;
    
    nomad.subscribe('settings', (data) => {
      firedData = data;
    });

    const mockStorageData = JSON.stringify({
      cache: { settings: { theme: 'dark' } },
      queue: []
    });

    const event = new window.StorageEvent('storage', {
      key: 'cache-nomad-data',
      newValue: mockStorageData
    });

    window.dispatchEvent(event);

    expect(firedData).toEqual({ theme: 'dark' });
  });
});
