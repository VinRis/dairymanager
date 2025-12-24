const DB_NAME = 'DairyFarmDB';
const DB_VERSION = 1;

const db = {
    _db: null,

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onupgradeneeded = (e) => {
                const d = e.target.result;
                if (!d.objectStoreNames.contains('settings')) d.createObjectStore('settings', { keyPath: 'id' });
                if (!d.objectStoreNames.contains('production')) d.createObjectStore('production', { keyPath: 'id', autoIncrement: true });
                if (!d.objectStoreNames.contains('finance')) d.createObjectStore('finance', { keyPath: 'id', autoIncrement: true });
                if (!d.objectStoreNames.contains('health')) d.createObjectStore('health', { keyPath: 'id', autoIncrement: true });
                if (!d.objectStoreNames.contains('inventory')) d.createObjectStore('inventory', { keyPath: 'id', autoIncrement: true });
            };

            request.onsuccess = (e) => {
                this._db = e.target.result;
                resolve();
            };
            request.onerror = (e) => reject(e);
        });
    },

    async save(storeName, data) {
        const tx = this._db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        return new Promise((resolve) => {
            const req = store.put(data);
            req.onsuccess = () => resolve(req.result);
        });
    },

    async getAll(storeName) {
        const tx = this._db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        return new Promise((resolve) => {
            const req = store.getAll();
            req.onsuccess = () => resolve(req.result);
        });
    },

    async delete(storeName, id) {
        const tx = this._db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        return new Promise((resolve) => {
            const req = store.delete(id);
            req.onsuccess = () => resolve();
        });
    },

    async clearStore(storeName) {
        const tx = this._db.transaction(storeName, 'readwrite');
        tx.objectStore(storeName).clear();
    }
};
