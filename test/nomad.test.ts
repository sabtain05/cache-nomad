import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CacheNomad } from '../src/index';
import { LocalStorageAdapter } from '../src/adapters';

describe('CacheNomad v3', () => {
  let nomad: CacheNomad;

  beforeEach(async () => {
    localStorage.clear();
    

    nomad = new CacheNomad(new LocalStorageAdapter());
    await nomad.init();
  });

  it('should store and query data asynchronously', async () => {
    const fetcher = vi.fn().mockResolvedValue({ user: 'Alice' });

    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);

    const data = await nomad.query('user-profile', fetcher);
    
    expect(fetcher).toHaveBeenCalled();
    expect(data).toEqual({ user: 'Alice' });
  });

  it('should queue and process actions', async () => {
    let serverReceived = null;

    nomad.registerAction('UPDATE_NAME', async (payload) => {
      serverReceived = payload;
    });

    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);

    await nomad.mutate('user-profile', { name: 'Bob' }, 'UPDATE_NAME', { name: 'Bob' });

    await new Promise((r) => setTimeout(r, 10));

    expect(serverReceived).toEqual({ name: 'Bob' });
  });

  it('should execute middleware interceptors', async () => {
    let receivedToken = null;

    nomad.registerAction('SECURE_ACTION', async (payload) => {
      receivedToken = payload.token;
    });

    nomad.addInterceptor(async (action) => {
      action.payload.token = 'super-secret-jwt';
      return action;
    });

    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);

    await nomad.mutate('data', { id: 1 }, 'SECURE_ACTION', { id: 1 });
    
    await new Promise((r) => setTimeout(r, 10));

    expect(receivedToken).toEqual('super-secret-jwt');
  });
});