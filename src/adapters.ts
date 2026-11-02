import { StorageAdapter } from './index';

export class IndexedDBAdapter implements StorageAdapter {
  private dbName = 'NomadDB';
  private storeName = 'NomadStore';

  private async getDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);
      request.onupgradeneeded = () => request.result.createObjectStore(this.storeName);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async get(key: string): Promise<any> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const request = db.transaction(this.storeName, 'readonly').objectStore(this.storeName).get(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async set(key: string, value: any): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const request = db.transaction(this.storeName, 'readwrite').objectStore(this.storeName).put(value, key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async remove(key: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const request = db.transaction(this.storeName, 'readwrite').objectStore(this.storeName).delete(key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

export class LocalStorageAdapter implements StorageAdapter {
  async get(key: string) { return typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null; }
  async set(key: string, value: any) { if (typeof localStorage !== 'undefined') localStorage.setItem(key, value); }
  async remove(key: string) { if (typeof localStorage !== 'undefined') localStorage.removeItem(key); }
}