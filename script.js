const desktopIcons = document.getElementById("desktopIcons");
const activeFolderName = document.getElementById("activeFolderName");
const folderList = document.getElementById("folderList");
const widgetCard = document.querySelector(".widget-card");

const ICON_WIDTH = 106;
const ICON_HEIGHT = 98;

// ── Session & Sync ──────────────────────────────────────────────────────────

function getOrCreateSessionId() {
  let id = sessionStorage.getItem("roomSessionId");
  if (!id) {
    id = Math.random().toString(36).slice(2, 10).toUpperCase();
    sessionStorage.setItem("roomSessionId", id);
  }
  return id;
}

const SESSION_ID = getOrCreateSessionId();
const sync = new SyncManager(SESSION_ID);

function getMobileUrl() {
  const base = window.location.href.replace(/\/[^/]*$/, "/mobile.html");
  return `${base}?s=${SESSION_ID}`;
}

function initSecondScreenPanel() {
  const qrSessionId = document.getElementById("qrSessionId");
  const qrLink      = document.getElementById("qrLink");
  const qrCode      = document.getElementById("qrCode");
  const syncMode    = document.getElementById("syncMode");

  if (!qrCode) {
    return;
  }

  const mobileUrl = getMobileUrl();

  if (qrSessionId) {
    qrSessionId.textContent = SESSION_ID;
  }
  if (qrLink) {
    qrLink.href = mobileUrl;
    qrLink.textContent = "Link öffnen ↗";
  }
  if (syncMode) {
    syncMode.textContent = sync.isFirebaseActive()
      ? "🟢 Firebase aktiv – geräteübergreifend"
      : "🟡 BroadcastChannel – nur gleicher Browser";
  }

  if (typeof QRCode !== "undefined") {
    new QRCode(qrCode, {
      text: mobileUrl,
      width: 110,
      height: 110,
      colorDark: "#0f1623",
      colorLight: "#ffffff",
      correctLevel: QRCode.CorrectLevel.M
    });
  } else {
    qrCode.innerHTML = `<a class="qr-fallback-link" href="${mobileUrl}" target="_blank" rel="noopener noreferrer">Mobile öffnen ↗</a>`;
  }
}

// ── Data ────────────────────────────────────────────────────────────────────

const folderPool = [
  "bed",
  "wardrobe",
  "desk",
  "trash can"
];

const filePool = [
  "cap1.hat",
  "cap2.hat",
  "bear.teddy",
  "dog.teddy",
  "sock1.socks",
  "sock2.socks",
  "sock3.socks",
  "sock4.socks",
  "sweater.top",
  "shirt.top",
  "shirt2.top"
];

const fileFolderMap = {
  "cap1.hat": "wardrobe",
  "cap2.hat": "wardrobe",
  "sock1.socks": "wardrobe",
  "sock2.socks": "wardrobe",
  "sock3.socks": "wardrobe",
  "sock4.socks": "wardrobe",
  "sweater.top": "wardrobe",
  "shirt.top": "wardrobe",
  "shirt2.top": "wardrobe",
  "bear.teddy": "bed",
  "dog.teddy": "bed"
};

let draggingFileId = null;

function shuffle(values) {
  const copied = [...values];
  for (let index = copied.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copied[index], copied[swapIndex]] = [copied[swapIndex], copied[index]];
  }
  return copied;
}

function createDesktopState() {
  const selectedFolders = [...folderPool];

  const folders = selectedFolders.map((name, index) => ({
    id: `folder-${index + 1}`,
    name,
    files: []
  }));

  const files = filePool.map((name, index) => {
    return {
      id: `file-${index + 1}`,
      name,
      location: "desktop"
    };
  });

  return {
    folders,
    files,
    activeFolderId: folders[0].id,
    positions: {}
  };
}

const state = createDesktopState();

function makeIconElement(item, kind) {
  const element = document.createElement("button");
  element.className = "desktop-icon";
  element.dataset.kind = kind;
  element.type = "button";

  const shape = document.createElement("span");
  shape.className = `icon-shape ${kind}`;

  const label = document.createElement("span");
  label.className = "icon-label";
  label.textContent = item.name;

  element.append(shape, label);
  return element;
}

function overlaps(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function getForbiddenZones(containerRect) {
  const zones = [];

  if (widgetCard) {
    const widgetRect = widgetCard.getBoundingClientRect();
    zones.push({
      x: widgetRect.left - containerRect.left - 14,
      y: widgetRect.top - containerRect.top - 14,
      w: widgetRect.width + 28,
      h: widgetRect.height + 28
    });
  }

  return zones;
}

function getRandomPosition(maxX, maxY, blockedZones, placedItems) {
  for (let attempt = 0; attempt < 220; attempt += 1) {
    const x = Math.round(Math.random() * maxX);
    const y = Math.round(Math.random() * maxY);
    const candidate = { x, y, w: ICON_WIDTH, h: ICON_HEIGHT };

    const inBlockedZone = blockedZones.some((zone) => overlaps(candidate, zone));
    if (inBlockedZone) {
      continue;
    }

    const tooClose = placedItems.some((item) => {
      const dx = Math.abs(item.x - x);
      const dy = Math.abs(item.y - y);
      return dx < 70 && dy < 66;
    });

    if (!tooClose) {
      return { x, y };
    }
  }

  return {
    x: Math.round(Math.random() * maxX),
    y: Math.round(Math.random() * maxY)
  };
}

function applyRandomLayout() {
  if (!desktopIcons) {
    return;
  }

  const containerRect = desktopIcons.getBoundingClientRect();
  const maxX = Math.max(0, containerRect.width - ICON_WIDTH);
  const maxY = Math.max(0, containerRect.height - ICON_HEIGHT);
  const blockedZones = getForbiddenZones(containerRect);
  const placedItems = [];
  const icons = [...desktopIcons.querySelectorAll(".desktop-icon")];

  icons.forEach((icon) => {
    const itemId = icon.dataset.id;
    let position = state.positions[itemId];

    const isOutOfBounds =
      !position ||
      position.x < 0 ||
      position.y < 0 ||
      position.x > maxX ||
      position.y > maxY;

    if (isOutOfBounds) {
      position = getRandomPosition(maxX, maxY, blockedZones, placedItems);
      state.positions[itemId] = position;
    }

    placedItems.push(position);
    icon.style.left = `${position.x}px`;
    icon.style.top = `${position.y}px`;
  });
}

function setActiveFolder(folderId) {
  state.activeFolderId = folderId;
  renderFolderPanel();
}

function renderFolderPanel() {
  const folder = state.folders.find((entry) => entry.id === state.activeFolderId);
  if (!folder) {
    return;
  }

  activeFolderName.textContent = `${folder.name} Inhalt`;
  folderList.innerHTML = "";

  if (!folder.files.length) {
    const empty = document.createElement("li");
    empty.className = "is-empty";
    empty.textContent = "Noch keine Dateien";
    folderList.append(empty);
    return;
  }

  folder.files.forEach((fileName) => {
    const row = document.createElement("li");
    row.textContent = fileName;
    folderList.append(row);
  });
}

function moveFileToFolder(fileId, folderId) {
  const file = state.files.find((entry) => entry.id === fileId);
  const folder = state.folders.find((entry) => entry.id === folderId);

  if (!file || !folder || file.location === folderId) {
    return;
  }

  const targetFolderName = fileFolderMap[file.name];
  if (targetFolderName !== folder.name) {
    return;
  }

  state.folders.forEach((entry) => {
    entry.files = entry.files.filter((name) => name !== file.name);
  });

  folder.files.push(file.name);
  file.location = folderId;

  sync.emit("file_cleaned", { fileName: file.name, folderName: folder.name });

  setActiveFolder(folderId);
  renderDesktop();
}

function renderDesktop() {
  desktopIcons.innerHTML = "";

  state.folders.forEach((folder) => {
    const folderElement = makeIconElement(folder, "folder");
    folderElement.dataset.id = folder.id;

    const counter = document.createElement("span");
    counter.className = "icon-count";
    counter.textContent = `${folder.files.length} Datei${folder.files.length === 1 ? "" : "en"}`;
    folderElement.append(counter);

    folderElement.addEventListener("click", () => {
      setActiveFolder(folder.id);
    });

    folderElement.addEventListener("dragover", (event) => {
      if (!draggingFileId) {
        return;
      }

      const draggingFile = state.files.find((entry) => entry.id === draggingFileId);
      const isAllowed = draggingFile && fileFolderMap[draggingFile.name] === folder.name;
      if (!isAllowed) {
        return;
      }

      event.preventDefault();
      folderElement.classList.add("is-drop-target");
    });

    folderElement.addEventListener("dragleave", () => {
      folderElement.classList.remove("is-drop-target");
    });

    folderElement.addEventListener("drop", (event) => {
      event.preventDefault();
      const fileId = event.dataTransfer.getData("text/plain");
      folderElement.classList.remove("is-drop-target");
      moveFileToFolder(fileId, folder.id);
    });

    desktopIcons.append(folderElement);
  });

  state.files
    .filter((file) => file.location === "desktop")
    .forEach((file) => {
      const fileElement = makeIconElement(file, "file");
      fileElement.dataset.id = file.id;
      fileElement.draggable = true;

      fileElement.addEventListener("dragstart", (event) => {
        draggingFileId = file.id;
        fileElement.classList.add("is-dragging");
        event.dataTransfer.setData("text/plain", file.id);
        event.dataTransfer.effectAllowed = "move";
      });

      fileElement.addEventListener("dragend", () => {
        draggingFileId = null;
        fileElement.classList.remove("is-dragging");
      });

      desktopIcons.append(fileElement);
    });

  applyRandomLayout();
  renderFolderPanel();
}

renderDesktop();
initSecondScreenPanel();

window.addEventListener("resize", () => {
  applyRandomLayout();
});