/**
 * SyncManager – Echtzeit-Synchronisation zwischen Desktop und Handy
 *
 * Strategie:
 *  1. BroadcastChannel  → funktioniert immer (gleicher Browser, mehrere Tabs)
 *  2. Firebase RTDB     → funktioniert geräteübergreifend (erfordert firebase-config.js)
 */

const CHANNEL_PREFIX = "room-cleanup-";

class SyncManager {
  constructor(sessionId) {
    this._sessionId = sessionId;
    this._clientId = Math.random().toString(36).slice(2);
    this._listeners = [];
    this._firebaseRef = null;
    this._bc = null;

    this._initBroadcastChannel();
    this._initFirebase();
  }

  _initBroadcastChannel() {
    if (typeof BroadcastChannel === "undefined") {
      return;
    }
    this._bc = new BroadcastChannel(CHANNEL_PREFIX + this._sessionId);
    this._bc.addEventListener("message", (e) => {
      if (e.data && e.data._clientId !== this._clientId) {
        this._dispatch(e.data);
      }
    });
  }

  _initFirebase() {
    if (
      typeof FIREBASE_CONFIG === "undefined" ||
      FIREBASE_CONFIG.apiKey === "YOUR_FIREBASE_API_KEY" ||
      typeof firebase === "undefined"
    ) {
      return;
    }

    try {
      const app = firebase.apps.length
        ? firebase.app()
        : firebase.initializeApp(FIREBASE_CONFIG);

      const db = firebase.database(app);
      this._firebaseRef = db.ref(`sessions/${this._sessionId}/events`);

      this._firebaseRef.on("child_added", (snapshot) => {
        const data = snapshot.val();
        if (data && data._clientId !== this._clientId) {
          this._dispatch(data);
        }
      });
    } catch (err) {
      console.warn("[Sync] Firebase nicht aktiv:", err.message);
    }
  }

  emit(type, payload) {
    const event = {
      type,
      ...payload,
      _clientId: this._clientId,
      _ts: Date.now()
    };

    if (this._bc) {
      this._bc.postMessage(event);
    }

    if (this._firebaseRef) {
      this._firebaseRef.push(event);
    }
  }

  on(callback) {
    this._listeners.push(callback);
  }

  isFirebaseActive() {
    return this._firebaseRef !== null;
  }

  _dispatch(event) {
    this._listeners.forEach((cb) => cb(event));
  }
}
