import { useState, useEffect, useCallback } from 'react';
import { nomad } from './index';

export function useNomad<T = any>(key: string, fetcher?: () => Promise<T>) {
    const [data, setData] = useState<T | undefined>(undefined);

    useEffect(() => {
        const unsubscribe = nomad.subscribe(key, (newData: T) => {
            setData(newData);
        });

        if (fetcher) {
            nomad.query(key, fetcher);
        }
        return () => {
            unsubscribe();
        };
    }, [key]);

    
}