// IndexedDB wrapper for offline study mode
// Stores: notes, flashcard_decks, flashcards, pending_reviews, sync_meta

const DB_NAME = 'studily-offline';
const DB_VERSION = 1;

export interface PendingReview {
  id: string; // flashcard id
  deckId: string;
  quality: number;
  currentEaseFactor: number;
  currentInterval: number;
  currentRepetitions: number;
  queuedAt: string;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('notes')) {
        db.createObjectStore('notes', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('flashcard_decks')) {
        db.createObjectStore('flashcard_decks', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('flashcards')) {
        const store = db.createObjectStore('flashcards', { keyPath: 'id' });
        store.createIndex('deck_id', 'deck_id', { unique: false });
      }
      if (!db.objectStoreNames.contains('pending_reviews')) {
        db.createObjectStore('pending_reviews', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('sync_meta')) {
        db.createObjectStore('sync_meta', { keyPath: 'store' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Generic helpers
async function putAll<T>(storeName: string, items: T[]): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(storeName, 'readwrite');
  const store = tx.objectStore(storeName);
  for (const item of items) {
    store.put(item);
  }
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

async function getAll<T>(storeName: string): Promise<T[]> {
  const db = await openDB();
  const tx = db.transaction(storeName, 'readonly');
  const store = tx.objectStore(storeName);
  const request = store.getAll();
  return new Promise((resolve, reject) => {
    request.onsuccess = () => { db.close(); resolve(request.result as T[]); };
    request.onerror = () => { db.close(); reject(request.error); };
  });
}

async function getAllByIndex<T>(storeName: string, indexName: string, value: IDBValidKey): Promise<T[]> {
  const db = await openDB();
  const tx = db.transaction(storeName, 'readonly');
  const store = tx.objectStore(storeName);
  const index = store.index(indexName);
  const request = index.getAll(value);
  return new Promise((resolve, reject) => {
    request.onsuccess = () => { db.close(); resolve(request.result as T[]); };
    request.onerror = () => { db.close(); reject(request.error); };
  });
}

async function clearStore(storeName: string): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(storeName, 'readwrite');
  tx.objectStore(storeName).clear();
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

async function deleteItem(storeName: string, key: IDBValidKey): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(storeName, 'readwrite');
  tx.objectStore(storeName).delete(key);
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

// Public API
export const offlineStorage = {
  // Notes
  cacheNotes: (notes: any[]) => putAll('notes', notes.slice(0, 100)),
  getCachedNotes: () => getAll<any>('notes'),

  // Decks
  cacheDecks: (decks: any[]) => putAll('flashcard_decks', decks),
  getCachedDecks: () => getAll<any>('flashcard_decks'),

  // Flashcards
  cacheFlashcards: (cards: any[]) => putAll('flashcards', cards),
  getCachedFlashcards: (deckId: string) => getAllByIndex<any>('flashcards', 'deck_id', deckId),
  getAllCachedFlashcards: () => getAll<any>('flashcards'),

  // Pending reviews
  queueReview: (review: PendingReview) => putAll('pending_reviews', [review]),
  getPendingReviews: () => getAll<PendingReview>('pending_reviews'),
  removePendingReview: (id: string) => deleteItem('pending_reviews', id),
  clearPendingReviews: () => clearStore('pending_reviews'),

  // Clear everything (sign-out / version bump)
  clearAll: async () => {
    await Promise.all([
      clearStore('notes'),
      clearStore('flashcard_decks'),
      clearStore('flashcards'),
      clearStore('pending_reviews'),
      clearStore('sync_meta'),
    ]);
  },
};
