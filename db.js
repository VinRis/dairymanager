const db = {
    dbName: 'DairyFarmDB',
    version: 1,

    init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);
            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                db.createObjectStore('production', { keyPath: 'id', autoIncrement: true });
                db.createObjectStore('finance', { keyPath: 'id', autoIncrement: true });
                db.createObjectStore('health', { keyPath: 'id', autoIncrement: true });
                db.createObjectStore('settings', { keyPath: 'key' });
            };
            request.onsuccess = (e) => resolve(e.target.result);
            request.onerror = (e) => reject(e.target.error);
        });
    },

    async getAll(storeName) {
        const database = await this.init();
        return new Promise((resolve) => {
            const tx = database.transaction(storeName, 'readonly');
            const store = tx.objectStore(storeName);
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
        });
    },

    async exportAllData() {
        const stores = ['production', 'finance', 'health', 'settings'];
        const exportData = {};
        for (const store of stores) {
            exportData[store] = await this.getAll(store);
        }
        return exportData;
    }
};
