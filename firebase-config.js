/**
 * Firebase Realtime Database – Konfiguration
 *
 * Um die Echtzeit-Synchronisation zwischen Desktop und Smartphone
 * GERÄTEÜBERGREIFEND zu aktivieren, folge diesen Schritten:
 *
 *  1. Erstelle ein kostenloses Firebase-Konto: https://console.firebase.google.com
 *  2. Lege ein neues Projekt an (z. B. "myspace-room").
 *  3. Aktiviere unter „Erstellen → Realtime Database" eine Datenbank
 *     (im Testmodus starten – Regeln später absichern!).
 *  4. Gehe zu Projekteinstellungen (⚙) → Allgemein → Deine Apps
 *     → Web-App hinzufügen und kopiere die Konfiguration hierher.
 *  5. Ersetze alle „YOUR_…"-Platzhalter mit deinen echten Werten.
 *
 * Ohne gültige Konfiguration läuft die Synchronisation automatisch nur
 * über den BroadcastChannel-Fallback (funktioniert im selben Browser).
 */
const FIREBASE_CONFIG = {
  apiKey: "YOUR_FIREBASE_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
