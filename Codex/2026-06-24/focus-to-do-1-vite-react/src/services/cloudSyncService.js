import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebaseClient';
import { normalizeAppData } from './storageService';

function appStateRef(userId) {
  if (!db) throw new Error('Firestore is not configured.');
  return doc(db, 'users', userId, 'app', 'state');
}

export async function loadCloudAppData(userId) {
  if (!isFirebaseConfigured || !userId) return null;
  const snapshot = await getDoc(appStateRef(userId));
  if (!snapshot.exists()) return null;
  return normalizeAppData(snapshot.data()?.appData);
}

export async function saveCloudAppData(userId, appData) {
  if (!isFirebaseConfigured || !userId) return;
  await setDoc(
    appStateRef(userId),
    {
      appData: normalizeAppData(appData),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}
