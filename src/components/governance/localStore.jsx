// IndexedDB Local Artifact Store for Hybrid Runtime

const DB_NAME = "lotus_governed_runner";
const DB_VERSION = 1;

let dbInstance = null;

function openDB() {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      resolve(dbInstance);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Artifacts store
      if (!db.objectStoreNames.contains("artifacts")) {
        const artifactStore = db.createObjectStore("artifacts", { keyPath: "id", autoIncrement: true });
        artifactStore.createIndex("type", "type", { unique: false });
        artifactStore.createIndex("created_at", "created_at", { unique: false });
      }

      // Evidence runs store
      if (!db.objectStoreNames.contains("evidence_runs")) {
        const evidenceStore = db.createObjectStore("evidence_runs", { keyPath: "run_id" });
        evidenceStore.createIndex("timestamp", "timestamp", { unique: false });
        evidenceStore.createIndex("mode", "mode", { unique: false });
      }

      // Contracts store
      if (!db.objectStoreNames.contains("contracts")) {
        db.createObjectStore("contracts", { keyPath: "version" });
      }

      // Settings store
      if (!db.objectStoreNames.contains("settings")) {
        db.createObjectStore("settings", { keyPath: "key" });
      }

      // Cache store
      if (!db.objectStoreNames.contains("cache")) {
        const cacheStore = db.createObjectStore("cache", { keyPath: "cache_key" });
        cacheStore.createIndex("created_at", "created_at", { unique: false });
      }
    };
  });
}

// Artifacts CRUD
export async function createArtifact(artifact) {
  const db = await openDB();
  const tx = db.transaction("artifacts", "readwrite");
  const store = tx.objectStore("artifacts");
  
  const newArtifact = {
    ...artifact,
    created_at: Date.now(),
    updated_at: Date.now(),
    size_bytes: JSON.stringify(artifact.body).length,
  };
  
  return new Promise((resolve, reject) => {
    const request = store.add(newArtifact);
    request.onsuccess = () => resolve({ ...newArtifact, id: request.result });
    request.onerror = () => reject(request.error);
  });
}

export async function listArtifacts() {
  const db = await openDB();
  const tx = db.transaction("artifacts", "readonly");
  const store = tx.objectStore("artifacts");
  
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function updateArtifact(id, updates) {
  const db = await openDB();
  const tx = db.transaction("artifacts", "readwrite");
  const store = tx.objectStore("artifacts");
  
  return new Promise(async (resolve, reject) => {
    const getRequest = store.get(id);
    getRequest.onsuccess = () => {
      const artifact = getRequest.result;
      if (!artifact) {
        reject(new Error("Artifact not found"));
        return;
      }
      
      const updated = {
        ...artifact,
        ...updates,
        updated_at: Date.now(),
        size_bytes: JSON.stringify(updates.body || artifact.body).length,
      };
      
      const putRequest = store.put(updated);
      putRequest.onsuccess = () => resolve(updated);
      putRequest.onerror = () => reject(putRequest.error);
    };
    getRequest.onerror = () => reject(getRequest.error);
  });
}

export async function deleteArtifact(id) {
  const db = await openDB();
  const tx = db.transaction("artifacts", "readwrite");
  const store = tx.objectStore("artifacts");
  
  return new Promise((resolve, reject) => {
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Evidence runs
export async function saveEvidenceRun(evidenceRun) {
  const db = await openDB();
  const tx = db.transaction("evidence_runs", "readwrite");
  const store = tx.objectStore("evidence_runs");
  
  return new Promise((resolve, reject) => {
    const request = store.put(evidenceRun);
    request.onsuccess = () => resolve(evidenceRun);
    request.onerror = () => reject(request.error);
  });
}

export async function listEvidenceRuns(limit = 50) {
  const db = await openDB();
  const tx = db.transaction("evidence_runs", "readonly");
  const store = tx.objectStore("evidence_runs");
  const index = store.index("timestamp");
  
  return new Promise((resolve, reject) => {
    const request = index.openCursor(null, "prev");
    const results = [];
    
    request.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor && results.length < limit) {
        results.push(cursor.value);
        cursor.continue();
      } else {
        resolve(results);
      }
    };
    request.onerror = () => reject(request.error);
  });
}

// Cache
export async function getCached(cacheKey) {
  const db = await openDB();
  const tx = db.transaction("cache", "readonly");
  const store = tx.objectStore("cache");
  
  return new Promise((resolve, reject) => {
    const request = store.get(cacheKey);
    request.onsuccess = () => {
      const cached = request.result;
      // Expire after 1 hour
      if (cached && Date.now() - cached.created_at < 3600000) {
        resolve(cached.value);
      } else {
        resolve(null);
      }
    };
    request.onerror = () => reject(request.error);
  });
}

export async function setCached(cacheKey, value) {
  const db = await openDB();
  const tx = db.transaction("cache", "readwrite");
  const store = tx.objectStore("cache");
  
  return new Promise((resolve, reject) => {
    const request = store.put({
      cache_key: cacheKey,
      value,
      created_at: Date.now(),
    });
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function clearCache() {
  const db = await openDB();
  const tx = db.transaction("cache", "readwrite");
  const store = tx.objectStore("cache");
  
  return new Promise((resolve, reject) => {
    const request = store.clear();
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Settings
export async function getSetting(key, defaultValue = null) {
  const db = await openDB();
  const tx = db.transaction("settings", "readonly");
  const store = tx.objectStore("settings");
  
  return new Promise((resolve, reject) => {
    const request = store.get(key);
    request.onsuccess = () => resolve(request.result?.value ?? defaultValue);
    request.onerror = () => reject(request.error);
  });
}

export async function setSetting(key, value) {
  const db = await openDB();
  const tx = db.transaction("settings", "readwrite");
  const store = tx.objectStore("settings");
  
  return new Promise((resolve, reject) => {
    const request = store.put({ key, value });
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Export/Import
export async function exportArtifactPack() {
  const artifacts = await listArtifacts();
  return {
    version: 1,
    exported_at: new Date().toISOString(),
    artifacts,
  };
}

export async function importArtifactPack(pack) {
  const imported = [];
  for (const artifact of pack.artifacts) {
    const { id, ...data } = artifact;
    const newArtifact = await createArtifact(data);
    imported.push(newArtifact);
  }
  return imported;
}