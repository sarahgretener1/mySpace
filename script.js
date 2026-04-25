const desktopIcons = document.getElementById("desktopIcons");
const activeFolderName = document.getElementById("activeFolderName");
const folderList = document.getElementById("folderList");
const widgetCard = document.querySelector(".widget-card");
const successPanel = document.getElementById("successPanel");
const restartButton = document.getElementById("restartButton");

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
  const sessionParam = `s=${encodeURIComponent(SESSION_ID)}`;
  const publicBase = typeof FIREBASE_WEBAPP_URL === "string" ? FIREBASE_WEBAPP_URL.trim() : "";

  try {
    const current = new URL(window.location.href);
    const isHttp = current.protocol === "http:" || current.protocol === "https:";
    const isLocalHost =
      current.hostname === "localhost" ||
      current.hostname === "127.0.0.1" ||
      current.hostname.endsWith(".local");

    if (isHttp && !isLocalHost) {
      return `${current.origin}/mobile.html?${sessionParam}`;
    }
  } catch (_error) {
    // Fallback handled below.
  }

  if (publicBase) {
    return `${publicBase.replace(/\/$/, "")}/mobile.html?${sessionParam}`;
  }

  const fallbackBase = window.location.href.replace(/\/[^/]*$/, "/mobile.html");
  return `${fallbackBase}?${sessionParam}`;
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
    qrLink.textContent = "Open link ↗";
  }
  if (syncMode) {
    syncMode.textContent = sync.isFirebaseActive()
      ? "Firebase active - cross-device"
      : "BroadcastChannel - same browser only";
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
    qrCode.innerHTML = `<a class="qr-fallback-link" href="${mobileUrl}" target="_blank" rel="noopener noreferrer">Open mobile ↗</a>`;
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
  "bag1.bag",
  "bag2.bag",
  "can.bin",
  "sketchbook.book",
  "sock1.socks",
  "sock2.socks",
  "sock3.socks",
  "sock4.socks",
  "sweater.top",
  "sweater2.top",
  "shirt.top"
];

const fileFolderMap = {
  "cap1.hat": "wardrobe",
  "cap2.hat": "wardrobe",
  "bag1.bag": "wardrobe",
  "bag2.bag": "wardrobe",
  "can.bin": "trash can",
  "sketchbook.book": "desk",
  "sock1.socks": "wardrobe",
  "sock2.socks": "wardrobe",
  "sock3.socks": "wardrobe",
  "sock4.socks": "wardrobe",
  "sweater.top": "wardrobe",
  "sweater2.top": "wardrobe",
  "shirt.top": "wardrobe",
  "bear.teddy": "bed",
  "dog.teddy": "bed"
};

const fileIconMap = {
  "bag1.bag": "img/bag1.png",
  "bag2.bag": "img/bag2.png",
  "can.bin": "img/can.png",
  "sketchbook.book": "img/sketchbook.png",
  "cap1.hat": "img/cap1.png",
  "cap2.hat": "img/cap2.png",
  "bear.teddy": "img/bear.png",
  "dog.teddy": "img/dog.png",
  "sock1.socks": "img/sock1.png",
  "sock2.socks": "img/sock2.png",
  "sock3.socks": "img/sock1.png",
  "sock4.socks": "img/sock2.png",
  "sweater.top": "img/sweater1.png",
  "sweater2.top": "img/sweater2.png",
  "shirt.top": "img/shirt.png"
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

  if (kind === "file") {
    const iconUrl = fileIconMap[item.name];
    if (iconUrl) {
      shape.classList.add("has-image");
      shape.style.setProperty("--file-icon", `url(\"${iconUrl}\")`);
    }
  }

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
  if (!activeFolderName || !folderList) {
    return;
  }

  const folder = state.folders.find((entry) => entry.id === state.activeFolderId);
  if (!folder) {
    return;
  }

  activeFolderName.textContent = `${folder.name} Contents`;
  folderList.innerHTML = "";

  if (!folder.files.length) {
    const empty = document.createElement("li");
    empty.className = "is-empty";
    empty.textContent = "No files yet";
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
    counter.textContent = `${folder.files.length} File${folder.files.length === 1 ? "" : "s"}`;
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
  updateCompletionState();
}

function updateCompletionState() {
  if (!successPanel) {
    return;
  }

  const hasDesktopFilesInState = state.files.some((file) => file.location === "desktop");
  const hasDesktopFileIcons = desktopIcons
    ? desktopIcons.querySelector('[data-kind="file"]') !== null
    : false;

  const allCleaned = !hasDesktopFilesInState && !hasDesktopFileIcons;
  successPanel.hidden = !allCleaned;
}

function restartGame() {
  const nextState = createDesktopState();

  state.folders = nextState.folders;
  state.files = nextState.files;
  state.activeFolderId = nextState.activeFolderId;
  state.positions = nextState.positions;

  sync.emit("session_reset", {});
  renderDesktop();
}

if (restartButton) {
  restartButton.addEventListener("click", restartGame);
}

renderDesktop();
initSecondScreenPanel();

window.addEventListener("resize", () => {
  applyRandomLayout();
});