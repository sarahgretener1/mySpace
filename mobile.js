/**
 * mobile.js – Checkliste für das Second-Screen-Erlebnis
 *
 * Liest die Session-ID aus dem URL-Parameter "s",
 * baut die Checkliste auf und wartet auf Sync-Events vom Desktop.
 */

const CHECKLIST_GROUPS = [
  {
    id: "socks",
    label: "Socken",
    target: "wardrobe",
    files: ["sock1.socks", "sock2.socks", "sock3.socks", "sock4.socks"]
  },
  {
    id: "caps",
    label: "Kappen",
    target: "wardrobe",
    files: ["cap1.hat", "cap2.hat"]
  },
  {
    id: "shirts",
    label: "T-Shirts",
    target: "wardrobe",
    files: ["shirt.top", "shirt2.top"]
  },
  {
    id: "sweater",
    label: "Pullover",
    target: "wardrobe",
    files: ["sweater.top"]
  },
  {
    id: "plushies",
    label: "Kuscheltiere",
    target: "bed",
    files: ["bear.teddy", "dog.teddy"]
  }
];

const checkedFiles = new Set();
const groupCounts = new Map();

const FILE_TO_GROUP = CHECKLIST_GROUPS.reduce((acc, group) => {
  group.files.forEach((fileName) => {
    acc[fileName] = group.id;
  });
  return acc;
}, {});

let sync = null;

function getSessionId() {
  const params = new URLSearchParams(window.location.search);
  return params.get("s") || null;
}

function buildChecklist() {
  const list = document.getElementById("checklist");
  list.innerHTML = "";

  CHECKLIST_GROUPS.forEach((group) => {
    groupCounts.set(group.id, 0);

    const li = document.createElement("li");
    li.className = "checklist-item";
    li.id = `item-${group.id}`;
    li.setAttribute("aria-label", group.label);

    li.innerHTML = `
      <span class="item-text">
        <span class="item-name">- ${group.label}</span>
        <span class="item-count" id="count-${group.id}">0 / ${group.files.length}</span>
      </span>
    `;

    list.append(li);
  });
}

function markItemDone(fileName) {
  if (checkedFiles.has(fileName)) {
    return;
  }
  checkedFiles.add(fileName);

  const groupId = FILE_TO_GROUP[fileName];
  if (!groupId) {
    return;
  }

  const group = CHECKLIST_GROUPS.find((entry) => entry.id === groupId);
  if (!group) {
    return;
  }

  const currentDone = Math.min(group.files.length, (groupCounts.get(groupId) || 0) + 1);
  groupCounts.set(groupId, currentDone);

  const countLabel = document.getElementById(`count-${groupId}`);
  if (countLabel) {
    countLabel.textContent = `${currentDone} / ${group.files.length}`;
  }

  const li = document.getElementById(`item-${groupId}`);
  if (li && currentDone === group.files.length) {
    li.classList.add("is-done");
    li.setAttribute("aria-label", li.getAttribute("aria-label") + " – erledigt");
  }

  updateProgress();
}

function updateProgress() {
  const total = CHECKLIST_GROUPS.length;
  const done = CHECKLIST_GROUPS.filter((group) => {
    return (groupCounts.get(group.id) || 0) >= group.files.length;
  }).length;

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
