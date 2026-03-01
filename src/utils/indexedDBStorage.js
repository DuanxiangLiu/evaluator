const DB_NAME = 'eda-evaluator-db';
const DB_VERSION = 1;

const STORES = {
  EXPERIMENTS: 'experiments',
  SNAPSHOTS: 'snapshots',
  VERSIONS: 'versions'
};

let dbInstance = null;

const initDB = () => {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      resolve(dbInstance);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error('Failed to open IndexedDB'));
    };

    request.onsuccess = (event) => {
      dbInstance = event.target.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      if (!db.objectStoreNames.contains(STORES.EXPERIMENTS)) {
        const experimentStore = db.createObjectStore(STORES.EXPERIMENTS, { keyPath: 'id', autoIncrement: true });
        experimentStore.createIndex('name', 'name', { unique: false });
        experimentStore.createIndex('createdAt', 'createdAt', { unique: false });
        experimentStore.createIndex('algorithm', 'algorithm', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.SNAPSHOTS)) {
        const snapshotStore = db.createObjectStore(STORES.SNAPSHOTS, { keyPath: 'id', autoIncrement: true });
        snapshotStore.createIndex('experimentId', 'experimentId', { unique: false });
        snapshotStore.createIndex('timestamp', 'timestamp', { unique: false });
        snapshotStore.createIndex('version', 'version', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.VERSIONS)) {
        const versionStore = db.createObjectStore(STORES.VERSIONS, { keyPath: 'id', autoIncrement: true });
        versionStore.createIndex('experimentId', 'experimentId', { unique: false });
        versionStore.createIndex('versionTag', 'versionTag', { unique: false });
      }
    };
  });
};

const getStore = async (storeName, mode = 'readonly') => {
  const db = await initDB();
  const transaction = db.transaction(storeName, mode);
  return transaction.objectStore(storeName);
};

export const saveExperiment = async (experiment) => {
  const store = await getStore(STORES.EXPERIMENTS, 'readwrite');
  
  const experimentData = {
    ...experiment,
    createdAt: experiment.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  return new Promise((resolve, reject) => {
    const request = store.add(experimentData);
    request.onsuccess = () => resolve({ ...experimentData, id: request.result });
    request.onerror = () => reject(new Error('Failed to save experiment'));
  });
};

export const updateExperiment = async (id, experiment) => {
  const store = await getStore(STORES.EXPERIMENTS, 'readwrite');
  
  const experimentData = {
    ...experiment,
    id,
    updatedAt: new Date().toISOString()
  };

  return new Promise((resolve, reject) => {
    const request = store.put(experimentData);
    request.onsuccess = () => resolve(experimentData);
    request.onerror = () => reject(new Error('Failed to update experiment'));
  });
};

export const getExperiment = async (id) => {
  const store = await getStore(STORES.EXPERIMENTS);
  
  return new Promise((resolve, reject) => {
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error('Failed to get experiment'));
  });
};

export const getAllExperiments = async () => {
  const store = await getStore(STORES.EXPERIMENTS);
  
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => {
      const results = request.result || [];
      results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      resolve(results);
    };
    request.onerror = () => reject(new Error('Failed to get experiments'));
  });
};

export const deleteExperiment = async (id) => {
  const store = await getStore(STORES.EXPERIMENTS, 'readwrite');
  
  return new Promise((resolve, reject) => {
    const request = store.delete(id);
    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(new Error('Failed to delete experiment'));
  });
};

export const saveSnapshot = async (snapshot) => {
  const store = await getStore(STORES.SNAPSHOTS, 'readwrite');
  
  const snapshotData = {
    ...snapshot,
    timestamp: snapshot.timestamp || new Date().toISOString()
  };

  return new Promise((resolve, reject) => {
    const request = store.add(snapshotData);
    request.onsuccess = () => resolve({ ...snapshotData, id: request.result });
    request.onerror = () => reject(new Error('Failed to save snapshot'));
  });
};

export const getSnapshotsByExperiment = async (experimentId) => {
  const store = await getStore(STORES.SNAPSHOTS);
  const index = store.index('experimentId');
  
  return new Promise((resolve, reject) => {
    const request = index.getAll(experimentId);
    request.onsuccess = () => {
      const results = request.result || [];
      results.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      resolve(results);
    };
    request.onerror = () => reject(new Error('Failed to get snapshots'));
  });
};

export const deleteSnapshotsByExperiment = async (experimentId) => {
  const store = await getStore(STORES.SNAPSHOTS, 'readwrite');
  const index = store.index('experimentId');
  
  return new Promise((resolve, reject) => {
    const request = index.openCursor(experimentId);
    request.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      } else {
        resolve(true);
      }
    };
    request.onerror = () => reject(new Error('Failed to delete snapshots'));
  });
};

export const saveVersion = async (version) => {
  const store = await getStore(STORES.VERSIONS, 'readwrite');
  
  const versionData = {
    ...version,
    createdAt: version.createdAt || new Date().toISOString()
  };

  return new Promise((resolve, reject) => {
    const request = store.add(versionData);
    request.onsuccess = () => resolve({ ...versionData, id: request.result });
    request.onerror = () => reject(new Error('Failed to save version'));
  });
};

export const getVersionsByExperiment = async (experimentId) => {
  const store = await getStore(STORES.VERSIONS);
  const index = store.index('experimentId');
  
  return new Promise((resolve, reject) => {
    const request = index.getAll(experimentId);
    request.onsuccess = () => {
      const results = request.result || [];
      results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      resolve(results);
    };
    request.onerror = () => reject(new Error('Failed to get versions'));
  });
};

export const deleteVersionsByExperiment = async (experimentId) => {
  const store = await getStore(STORES.VERSIONS, 'readwrite');
  const index = store.index('experimentId');
  
  return new Promise((resolve, reject) => {
    const request = index.openCursor(experimentId);
    request.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      } else {
        resolve(true);
      }
    };
    request.onerror = () => reject(new Error('Failed to delete versions'));
  });
};

export const clearAllData = async () => {
  const db = await initDB();
  
  const clearStore = (storeName) => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error(`Failed to clear ${storeName}`));
    });
  };

  await Promise.all([
    clearStore(STORES.EXPERIMENTS),
    clearStore(STORES.SNAPSHOTS),
    clearStore(STORES.VERSIONS)
  ]);

  return true;
};

export const getStorageStats = async () => {
  const experiments = await getAllExperiments();
  let totalSnapshots = 0;
  let totalVersions = 0;

  for (const exp of experiments) {
    const snapshots = await getSnapshotsByExperiment(exp.id);
    const versions = await getVersionsByExperiment(exp.id);
    totalSnapshots += snapshots.length;
    totalVersions += versions.length;
  }

  return {
    experimentCount: experiments.length,
    snapshotCount: totalSnapshots,
    versionCount: totalVersions
  };
};

export const exportExperimentData = async (experimentId) => {
  const experiment = await getExperiment(experimentId);
  const snapshots = await getSnapshotsByExperiment(experimentId);
  const versions = await getVersionsByExperiment(experimentId);

  return {
    experiment,
    snapshots,
    versions,
    exportedAt: new Date().toISOString()
  };
};

export const importExperimentData = async (data) => {
  const { experiment, snapshots, versions } = data;

  const savedExperiment = await saveExperiment({
    ...experiment,
    id: undefined,
    createdAt: undefined,
    updatedAt: undefined
  });

  if (snapshots && snapshots.length > 0) {
    for (const snapshot of snapshots) {
      await saveSnapshot({
        ...snapshot,
        id: undefined,
        experimentId: savedExperiment.id
      });
    }
  }

  if (versions && versions.length > 0) {
    for (const version of versions) {
      await saveVersion({
        ...version,
        id: undefined,
        experimentId: savedExperiment.id
      });
    }
  }

  return savedExperiment;
};
