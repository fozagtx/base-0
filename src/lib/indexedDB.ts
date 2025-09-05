// IndexedDB utility for storing images and node data

const DB_NAME = 'AvatarPlaygroundDB';
const DB_VERSION = 1;
const STORE_IMAGES = 'images';
const STORE_NODES = 'nodes';

interface StoredImage {
  id: string;
  data: string; // base64 data URL
  filename: string;
  timestamp: number;
}

interface StoredNode {
  id: string;
  nodeData: any;
  timestamp: number;
}

class IndexedDBManager {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create images store
        if (!db.objectStoreNames.contains(STORE_IMAGES)) {
          const imageStore = db.createObjectStore(STORE_IMAGES, { keyPath: 'id' });
          imageStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Create nodes store
        if (!db.objectStoreNames.contains(STORE_NODES)) {
          const nodeStore = db.createObjectStore(STORE_NODES, { keyPath: 'id' });
          nodeStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  async storeImage(id: string, data: string, filename: string): Promise<void> {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction([STORE_IMAGES], 'readwrite');
    const store = transaction.objectStore(STORE_IMAGES);
    
    const imageData: StoredImage = {
      id,
      data,
      filename,
      timestamp: Date.now()
    };

    return new Promise((resolve, reject) => {
      const request = store.put(imageData);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getImage(id: string): Promise<StoredImage | null> {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction([STORE_IMAGES], 'readonly');
    const store = transaction.objectStore(STORE_IMAGES);
    
    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async storeNode(id: string, nodeData: any): Promise<void> {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction([STORE_NODES], 'readwrite');
    const store = transaction.objectStore(STORE_NODES);
    
    const storedNode: StoredNode = {
      id,
      nodeData,
      timestamp: Date.now()
    };

    return new Promise((resolve, reject) => {
      const request = store.put(storedNode);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getNode(id: string): Promise<StoredNode | null> {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction([STORE_NODES], 'readonly');
    const store = transaction.objectStore(STORE_NODES);
    
    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllImages(): Promise<StoredImage[]> {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction([STORE_IMAGES], 'readonly');
    const store = transaction.objectStore(STORE_IMAGES);
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteImage(id: string): Promise<void> {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction([STORE_IMAGES], 'readwrite');
    const store = transaction.objectStore(STORE_IMAGES);
    
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

export const dbManager = new IndexedDBManager();