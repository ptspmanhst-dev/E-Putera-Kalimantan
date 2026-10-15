import { getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer, type Firestore } from 'firebase/firestore';
import firebaseAppletConfig from '../../firebase-applet-config.json';

export type FirebaseDiagnostics = {
  isConfigured: boolean;
  missingVariables: string[];
  placeholderVariables: string[];
};

export function getClientConfig() {
  return {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.trim() || firebaseAppletConfig.apiKey || '',
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN?.trim() || firebaseAppletConfig.authDomain || '',
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim() || firebaseAppletConfig.projectId || '',
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim() || firebaseAppletConfig.storageBucket || '',
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID?.trim() || firebaseAppletConfig.messagingSenderId || '',
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID?.trim() || firebaseAppletConfig.appId || '',
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID?.trim() || firebaseAppletConfig.measurementId || '',
  };
}

export function getFirebaseConfigDiagnostics(): FirebaseDiagnostics {
  const missingVariables: string[] = [];
  const placeholderVariables: string[] = [];

  const config = getClientConfig();
  const apiKey = config.apiKey;
  const projectId = config.projectId;
  const authDomain = config.authDomain;

  if (!apiKey) {
    missingVariables.push('NEXT_PUBLIC_FIREBASE_API_KEY');
  } else if (apiKey.startsWith('AIzaSyDemoKey') || apiKey.includes('placeholder')) {
    placeholderVariables.push('NEXT_PUBLIC_FIREBASE_API_KEY');
  }

  if (!projectId) {
    missingVariables.push('NEXT_PUBLIC_FIREBASE_PROJECT_ID');
  } else if (projectId === 'demo-project-id' || projectId.includes('placeholder')) {
    placeholderVariables.push('NEXT_PUBLIC_FIREBASE_PROJECT_ID');
  }

  if (!authDomain) {
    missingVariables.push('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN');
  } else if (authDomain.includes('demo-project.firebaseapp.com')) {
    placeholderVariables.push('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN');
  }

  return {
    isConfigured: missingVariables.length === 0 && placeholderVariables.length === 0,
    missingVariables,
    placeholderVariables,
  };
}

export function isFirebaseConfigured(): boolean {
  return getFirebaseConfigDiagnostics().isConfigured;
}

export function getFirebaseApp(): FirebaseApp {
  const existing = getApps();
  if (existing.length > 0) {
    return existing[0];
  }
  return initializeApp(getClientConfig());
}

export function getFirebaseAuth(): Auth {
  const diagnostics = getFirebaseConfigDiagnostics();
  if (!diagnostics.isConfigured) {
    const reasons: string[] = [];
    if (diagnostics.missingVariables.length > 0) {
      reasons.push(`Variabel belum disetel: ${diagnostics.missingVariables.join(', ')}`);
    }
    if (diagnostics.placeholderVariables.length > 0) {
      reasons.push(`Variabel berupa placeholder: ${diagnostics.placeholderVariables.join(', ')}`);
    }
    throw new Error(
      `Firebase Authentication belum terkonfigurasi (${reasons.join('; ')}). Harap sediakan kredensial resmi Firebase di .env.local.`,
    );
  }
  return getAuth(getFirebaseApp());
}

export function getFirebaseFirestore(): Firestore {
  const app = getFirebaseApp();
  const databaseId = firebaseAppletConfig.firestoreDatabaseId;
  return databaseId ? getFirestore(app, databaseId) : getFirestore(app);
}

export async function testConnection(): Promise<void> {
  try {
    const db = getFirebaseFirestore();
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
