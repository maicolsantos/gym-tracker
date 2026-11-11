import { initializeApp, getApps, type FirebaseApp } from "firebase/app"
import { getAuth as _getAuth, connectAuthEmulator, GoogleAuthProvider, type Auth } from "firebase/auth"
import { initializeFirestore, connectFirestoreEmulator, persistentLocalCache, persistentMultipleTabManager, type Firestore } from "firebase/firestore"
import { getAnalytics as _getAnalytics, isSupported, type Analytics } from "firebase/analytics"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
}

let app: FirebaseApp
let auth: Auth
let db: Firestore
let _googleProvider: GoogleAuthProvider

function getApp() {
  if (!app) {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
  }
  return app
}

export function getAuth() {
  if (!auth) {
    auth = _getAuth(getApp())
    if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === "true") {
      connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true })
    }
  }
  return auth
}

export function getDb() {
  if (!db) {
    // Garante que o Auth e seu emulador foram inicializados primeiro
    getAuth()
    const isEmulator = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === "true"
    db = initializeFirestore(
      getApp(),
      isEmulator
        ? {}
        : {
            localCache: persistentLocalCache({
              tabManager: persistentMultipleTabManager(),
            }),
          },
    )
    if (isEmulator) {
      connectFirestoreEmulator(db, "127.0.0.1", 8088)
    }
  }
  return db
}

export async function initAnalytics() {
  if (typeof window !== "undefined" && await isSupported()) {
    _getAnalytics(getApp())
  }
}

export function getGoogleProvider() {
  if (!_googleProvider) {
    _googleProvider = new GoogleAuthProvider()
  }
  return _googleProvider
}
