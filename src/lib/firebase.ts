import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import config from '../../firebase-applet-config.json';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || config.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || config.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || config.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || config.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || config.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || config.appId
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, 'ai-studio-pembayaranqris-357c7a70-77b8-400a-b9c6-6bd2f414ac65');
export const storage = getStorage(app);
