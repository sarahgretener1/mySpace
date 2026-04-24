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

  // Firebase-Konfiguration – wird von sync.js als FIREBASE_CONFIG erwartet
  const FIREBASE_CONFIG = {
    apiKey: "AIzaSyBm_owScyd9m98cXDcAaHsexehVI0qIvlc",
    authDomain: "myspace-room.firebaseapp.com",
    databaseURL: "https://myspace-room-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "myspace-room",
    storageBucket: "myspace-room.firebasestorage.app",
    messagingSenderId: "660441624044",
    appId: "1:660441624044:web:10b98f67a4d9f74ca4e4c9"
  };

  // Public base URL used for QR links when desktop runs locally (localhost/file://)
  const FIREBASE_WEBAPP_URL = "https://myspace-room.web.app";

