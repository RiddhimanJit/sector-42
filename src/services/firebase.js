import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  onAuthStateChanged,
  signOut 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  onSnapshot,
  collection,
  query,
  orderBy,
  getDocs
} from 'firebase/firestore';

// Initialize Firebase only if config is provided
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

let app, auth, db;
const isConfigured = Boolean(firebaseConfig.apiKey);

if (isConfigured) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} else {
  console.warn("Firebase config missing. Multi-user features will use mock local state where possible, or fail gracefully. Please set up .env");
}

export { auth, db, isConfigured };

// --- Auth Services ---
let mockCurrentUser = null;
const MOCK_USER_KEY = 'tsoc_mock_user';

const triggerMockAuthChange = () => {
  window.dispatchEvent(new Event('mock-auth-changed'));
};

export const registerUser = async (email, password, username, factionId) => {
  if (!isConfigured) {
    const user = { uid: 'mock-' + Date.now(), email, username, factionId, inventory: [], score: 0 };
    localStorage.setItem(MOCK_USER_KEY, JSON.stringify(user));
    mockCurrentUser = user;
    triggerMockAuthChange();
    return user;
  }
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;
  
  // Create user profile document
  await setDoc(doc(db, 'users', user.uid), {
    username,
    factionId,
    score: 0,
    inventory: [],
    createdAt: new Date().toISOString()
  });

  return user;
};

export const loginUser = async (email, password) => {
  if (!isConfigured) {
    const saved = localStorage.getItem(MOCK_USER_KEY);
    if (saved) {
      mockCurrentUser = JSON.parse(saved);
      triggerMockAuthChange();
      return mockCurrentUser;
    }
    throw new Error("Mock user not found. Please register first.");
  }
  return await signInWithEmailAndPassword(auth, email, password);
};

export const logoutUser = async () => {
  if (!isConfigured) {
    mockCurrentUser = null;
    triggerMockAuthChange();
    return;
  }
  if (auth) await signOut(auth);
};

export const subscribeToAuthChanges = (callback) => {
  if (!isConfigured) {
    const saved = localStorage.getItem(MOCK_USER_KEY);
    if (saved && !mockCurrentUser) mockCurrentUser = JSON.parse(saved);
    
    const handler = () => callback(mockCurrentUser);
    window.addEventListener('mock-auth-changed', handler);
    setTimeout(() => callback(mockCurrentUser), 100);
    
    return () => window.removeEventListener('mock-auth-changed', handler);
  }
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      // fetch extended profile
      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        callback({ ...user, ...docSnap.data() });
      } else {
        callback(user);
      }
    } else {
      callback(null);
    }
  });
};

// --- Sync Services ---
export const syncUserData = async (userId, inventory, scoreToAdd = 0) => {
  if (!isConfigured || !userId) return;
  const userRef = doc(db, 'users', userId);
  
  // We'll just update inventory. Score is typically updated incrementally.
  // In a real robust app, you'd use FieldValue.increment() for scores to avoid race conditions.
  await updateDoc(userRef, {
    inventory
  });
  
  // If we need to update faction score
  if (scoreToAdd > 0) {
    const userDoc = await getDoc(userRef);
    if (userDoc.exists()) {
      const data = userDoc.data();
      const factionId = data.factionId;
      if (factionId && factionId !== 'free-roamer') {
        // Increment faction score
        // We'll do a simple read/write here for simplicity
        const factionRef = doc(db, 'factions', factionId);
        const factionSnap = await getDoc(factionRef);
        if (factionSnap.exists()) {
          const currentScore = factionSnap.data().score || 0;
          await updateDoc(factionRef, { score: currentScore + scoreToAdd });
        }
      }
    }
  }
};

// --- Faction Services ---
export const getFactionsOnce = async () => {
  if (!isConfigured) return [];
  const q = query(collection(db, 'factions'), orderBy('score', 'desc'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const subscribeToFactions = (callback) => {
  if (!isConfigured) return () => {};
  const q = query(collection(db, 'factions'), orderBy('score', 'desc'));
  return onSnapshot(q, (querySnapshot) => {
    const factions = [];
    querySnapshot.forEach((doc) => {
      factions.push({ id: doc.id, ...doc.data() });
    });
    callback(factions);
  });
};

// Helper function to seed initial factions if the db is empty
export const seedFactionsIfEmpty = async () => {
  if (!isConfigured) return;
  const existing = await getFactionsOnce();
  if (existing.length === 0) {
    const defaultFactions = [
      { id: 'f-1', name: 'Iron Wolves', members: 42, score: 8520, status: 'Hostile', color: '239, 68, 68' },
      { id: 'f-2', name: 'Neon Vanguard', members: 128, score: 7100, status: 'Neutral', color: '59, 130, 246' },
      { id: 'f-3', name: 'Bronze Barrons', members: 42, score: 2500, status: 'Friendly', color: '34, 197, 94' },
      { id: 'f-4', name: 'Scrap Barons', members: 15, score: 1950, status: 'Hostile', color: '245, 158, 11' },
      { id: 'f-5', name: 'Dust Walkers', members: 8, score: 1200, status: 'Neutral', color: '168, 85, 247' },
    ];
    for (const f of defaultFactions) {
      await setDoc(doc(db, 'factions', f.id), f);
    }
  }
};
