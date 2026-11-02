import { useState, useEffect, useCallback } from 'react';
import { CacheNomad } from './index';

export function useNomad<T = any>(nomadInstance: CacheNomad, key: string, fetcher?: () => Promise<T>, ttl?: number) {
  const [data, setData] = useState<T | undefined>(undefined);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    nomadInstance.init().then(() => {
      setIsReady(true);
      if (fetcher) nomadInstance.query(key, fetcher, ttl);
    });

    const unsubscribe = nomadInstance.subscribe(key, (newData: T) => setData(newData));
    return () => unsubscribe();
  }, [key, nomadInstance]);

  const mutate = useCallback(
    (optimisticData: T, actionName: string, payload: any, priority = 0) => {
      nomadInstance.mutate(key, optimisticData, actionName, payload, { priority, ttl });
    },
    [key, nomadInstance, ttl]
  );

  return { data, mutate, isReady };
}