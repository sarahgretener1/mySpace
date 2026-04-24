/**
 * mobile.js – Checkliste für das Second-Screen-Erlebnis
 *
 * Liest die Session-ID aus dem URL-Parameter "s",
 * baut die Checkliste auf und wartet auf Sync-Events vom Desktop.
 */

const CHECKLIST_ITEMS = [
  { id: "sock1.socks",  emoji: "🧦", label: "Socken 1",    target: "wardrobe" },
  { id: "sock2.socks",  emoji: "🧦", label: "Socken 2",    target: "wardrobe" },
  { id: "sock3.socks",  emoji: "🧦", label: "Socken 3",    target: "wardrobe" },
  { id: "sock4.socks",  emoji: "🧦", label: "Socken 4",    target: "wardrobe" },
  { id: "cap1.hat",     emoji: "🧢", label: "Kappe 1",     target: "wardrobe" },
  { id: "cap2.hat",     emoji: "🧢", label: "Kappe 2",     target: "wardrobe" },
  { id: "sweater.top",  emoji: "🧥", label: "Pullover",    target: "wardrobe" },
  { id: "shirt.top",    emoji: "👕", label: "T-Shirt 1",   target: "wardrobe" },
  { id: "shirt2.top",   emoji: "👕", label: "T-Shirt 2",   target: "wardrobe" },
  { id: "bear.teddy",   emoji: "🧸", label: "Teddybär",    target: "bed"      },
  { id: "dog.teddy",    emoji: "🐶", label: "Hund-Plüschi", target: "bed"     }
];

const FOLDER_LABELS = {
  wardrobe: "Kleiderschrank",
  bed:      "Bett",
  desk:     "Schreibtisch",
  "trash can": "Mülleimer"
};

const checkedItems = new Set();
let sync = null;

function getSessionId() {
  const params = new URLSearchParams(window.location.search);
  return params.get("s") || null;
}

function buildChecklist() {
  const list = document.getElementById("checklist");
  list.innerHTML = "";

  CHECKLIST_ITEMS.forEach((item) => {
    const li = document.createElement("li");
    li.className = "checklist-item";
    li.id = `item-${item.id}`;
    li.setAttribute("aria-label", item.label);

    const folderLabel = FOLDER_LABELS[item.target] || item.target;

    li.innerHTML = `
      <span class="item-emoji" aria-hidden="true">${item.emoji}</span>
      <span class="item-text">
        <span class="item-name">${item.label}</span>
        <span class="item-target">→ ${folderLabel}</span>
      </span>
      <span class="item-check" aria-hidden="true"></span>
    `;

    list.append(li);
  });
}

function markItemDone(fileName) {
  if (checkedItems.has(fileName)) {
    return;
  }
  checkedItems.add(fileName);

  const li = document.getElementById(`item-${fileName}`);
  if (li) {
    li.classList.add("is-done");
    li.setAttribute("aria-label", li.getAttribute("aria-label") + " – erledigt");
  }

  updateProgress();
}

function updateProgress() {
  const total = CHECKLIST_ITEMS.length;
  const done  = checkedItems.size;

  const fill  = document.getElementById("progressFill");
  const label = document.getElementById("progressLabel");
  const bar   = document.getElementById("progressBar");
  const done_ = document.getElementById("doneMessage");

  if (bar) {
    bar.hidden = false;
  }
  if (fill) {
    fill.style.width = `${Math.round((done / total) * 100)}%`;
  }
  if (label) {
    label.textContent = `${done} / ${total} aufgeräumt`;
  }
  if (done === total && done_) {
    done_.hidden = false;
  }
}

function setStatus(text, connected) {
  const dot  = document.getElementById("statusDot");
  const span = document.getElementById("statusText");
  if (span) {
    span.textContent = text;
  }
  if (dot) {
    dot.classList.toggle("is-connected", connected);
  }
}

function showNoSession() {
  const body = document.querySelector(".cl-body");
  if (!body) {
    return;
  }
  body.innerHTML = `
    <div class="no-session">
      <strong>Kein Desktop verbunden</strong>
      Öffne zuerst die Desktop-Ansicht und scanne den dort angezeigten QR-Code – oder rufe diese Seite über den angezeigten Link auf.
    </div>
  `;
}

function init() {
  const sessionId = getSessionId();

  if (!sessionId) {
    setStatus("Keine Session-ID in der URL", false);
    showNoSession();
    return;
  }

  const sessionDisplay = document.getElementById("sessionIdDisplay");
  const sessionInfo    = document.getElementById("sessionInfo");
  if (sessionDisplay) {
    sessionDisplay.textContent = sessionId;
  }
  if (sessionInfo) {
    sessionInfo.hidden = false;
  }

  buildChecklist();

  setStatus("Verbinde mit Desktop…", false);

  sync = new SyncManager(sessionId);

  sync.on((event) => {
    if (event.type === "file_cleaned") {
      setStatus("Verbunden – warte auf Aktionen", true);
      markItemDone(event.fileName);
    }
  });

  const modeText = sync.isFirebaseActive()
    ? "Verbunden (Firebase + BroadcastChannel)"
    : "Verbunden (BroadcastChannel – gleiches Gerät)";

  setStatus(modeText, true);
}

init();
