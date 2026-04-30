const els = {
  displayName: document.querySelector("#display-name"),
  signalingServer: document.querySelector("#signaling-server"),
  localFingerprint: document.querySelector("#local-fingerprint"),
  remoteFingerprint: document.querySelector("#remote-fingerprint"),
  createOffer: document.querySelector("#create-offer"),
  resetSession: document.querySelector("#reset-session"),
  localSignal: document.querySelector("#local-signal"),
  remoteSignal: document.querySelector("#remote-signal"),
  acceptSignal: document.querySelector("#accept-signal"),
  copyLocal: document.querySelector("#copy-local"),
  clearLocal: document.querySelector("#clear-local"),
  connectionDot: document.querySelector("#connection-dot"),
  connectionLabel: document.querySelector("#connection-label"),
  connectionDetail: document.querySelector("#connection-detail"),
  securityPill: document.querySelector("#security-pill"),
  mobileSettings: document.querySelector("#mobile-settings"),
  closeMobileSettings: document.querySelector("#close-mobile-settings"),
  deleteChat: document.querySelector("#delete-chat"),
  peerSummary: document.querySelector("#peer-summary"),
  sasCode: document.querySelector("#sas-code"),
  sessionKeyId: document.querySelector("#session-key-id"),
  confirmSas: document.querySelector("#confirm-sas"),
  messages: document.querySelector("#messages"),
  form: document.querySelector("#message-form"),
  messageInput: document.querySelector("#message-input"),
  sendMessage: document.querySelector("#send-message"),
  fileInput: document.querySelector("#file-input"),
  transfers: document.querySelector("#transfers"),
  secureWarning: document.querySelector("#secure-context-warning"),
  installApp: document.querySelector("#install-app"),
  chatList: document.querySelector("#chat-list"),
  newChat: document.querySelector("#new-chat"),
  reconnectChat: document.querySelector("#reconnect-chat"),
  mobileReconnectChat: document.querySelector("#mobile-reconnect-chat"),
  mobileChatSwitch: document.querySelector("#mobile-chat-switch"),
  openWizard: document.querySelector("#open-wizard"),
  connectDialog: document.querySelector("#connect-dialog"),
  deviceNameDialog: document.querySelector("#device-name-dialog"),
  deviceNameInput: document.querySelector("#device-name-input"),
  saveDeviceName: document.querySelector("#save-device-name"),
  closeWizard: document.querySelector("#close-wizard"),
  wizardSubtitle: document.querySelector("#wizard-subtitle"),
  wizardPages: [...document.querySelectorAll(".wizard-page")],
  wizardDots: [
    document.querySelector("#wizard-dot-1"),
    document.querySelector("#wizard-dot-2"),
    document.querySelector("#wizard-dot-3"),
    document.querySelector("#wizard-dot-4"),
  ],
  wizardStartA: document.querySelector("#wizard-start-a"),
  wizardStartB: document.querySelector("#wizard-start-b"),
  wizardManualA: document.querySelector("#wizard-manual-a"),
  wizardManualB: document.querySelector("#wizard-manual-b"),
  wizardShortCode: document.querySelector("#wizard-short-code"),
  wizardInviteLink: document.querySelector("#wizard-invite-link"),
  wizardInviteInput: document.querySelector("#wizard-invite-input"),
  wizardInviteQr: document.querySelector("#wizard-invite-qr"),
  wizardInviteQrNote: document.querySelector("#wizard-invite-qr-note"),
  wizardCopyInvite: document.querySelector("#wizard-copy-invite"),
  wizardOfferCode: document.querySelector("#wizard-offer-code"),
  wizardOfferQr: document.querySelector("#wizard-offer-qr"),
  wizardOfferQrNote: document.querySelector("#wizard-offer-qr-note"),
  wizardCopyOffer: document.querySelector("#wizard-copy-offer"),
  wizardOfferNext: document.querySelector("#wizard-offer-next"),
  wizardAnswerCode: document.querySelector("#wizard-answer-code"),
  wizardScanAnswer: document.querySelector("#wizard-scan-answer"),
  wizardScanAnswerState: document.querySelector("#wizard-scan-answer-state"),
  wizardAnswerVideo: document.querySelector("#wizard-answer-video"),
  wizardProcessAnswer: document.querySelector("#wizard-process-answer"),
  wizardRemoteOfferCode: document.querySelector("#wizard-remote-offer-code"),
  wizardScanOffer: document.querySelector("#wizard-scan-offer"),
  wizardScanOfferState: document.querySelector("#wizard-scan-offer-state"),
  wizardOfferVideo: document.querySelector("#wizard-offer-video"),
  wizardProcessOffer: document.querySelector("#wizard-process-offer"),
  wizardLocalAnswerCode: document.querySelector("#wizard-local-answer-code"),
  wizardAnswerQr: document.querySelector("#wizard-answer-qr"),
  wizardAnswerQrNote: document.querySelector("#wizard-answer-qr-note"),
  wizardCopyAnswer: document.querySelector("#wizard-copy-answer"),
  wizardAnswerWait: document.querySelector("#wizard-answer-wait"),
  wizardWaitState: document.querySelector("#wizard-wait-state"),
  wizardSasCode: document.querySelector("#wizard-sas-code"),
  wizardConfirmSas: document.querySelector("#wizard-confirm-sas"),
  wizardSecureState: document.querySelector("#wizard-secure-state"),
  checks: {
    identity: document.querySelector("#check-identity"),
    signature: document.querySelector("#check-signature"),
    session: document.querySelector("#check-session"),
    verified: document.querySelector("#check-verified"),
  },
};

const DB_NAME = "lan-secure-chat-v1";
const STORE = "keys";
const ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:global.stun.twilio.com:3478" },
];
const ACK_TIMEOUT_MS = 2500;
const MAX_RETRIES = 6;
const FILE_CHUNK_SIZE = 16 * 1024;
const ICE_GATHER_TIMEOUT_MS = 10000;
const CONNECTION_TIMEOUT_MS = 35000;
const SIGNALING_PROTOCOL = "lan-secure-chat-signal-v1";
const SIGNALING_ROOM_TTL_MS = 30 * 60 * 1000;
const DEFAULT_SIGNALING_SERVER = "https://signaling.p2p.di0n.de";
const MAX_QUEUED_REMOTE_CANDIDATES = 80;

const state = {
  db: null,
  identity: null,
  localIdentityKey: "",
  pc: null,
  channel: null,
  sessions: new Map(),
  localHello: null,
  remoteHello: null,
  remoteIdentityKey: null,
  remoteName: "",
  sessionKey: null,
  sessionId: "",
  sas: "",
  sendSeq: 0,
  receiveSeq: 0,
  localSasConfirmed: false,
  remoteSasConfirmed: false,
  pending: new Map(),
  seen: new Set(),
  flushingOutbox: false,
  pendingDraftChatId: "",
  activeChatId: "default",
  startupInvite: null,
  conversations: {},
  messages: [],
  files: new Map(),
  wizardRole: "",
  connectionWatch: null,
  scanStop: null,
  installPrompt: null,
  wizardCloseTimer: null,
  signaling: {
    socket: null,
    roomId: "",
    clientId: "",
    serverUrl: "",
    isOfferer: false,
    connectedAt: 0,
    seenSignals: new Set(),
    pendingCandidates: [],
    offerInFlight: false,
    lastRemoteOfferSdp: "",
  },
  diag: {
    localCandidates: 0,
    remoteCandidates: 0,
    candidateTypes: new Set(),
    channelOpen: false,
    lastIceState: "new",
    lastPeerState: "new",
  },
};

init().catch((error) => {
  console.error(error);
  setConnection("idle", "Start fehlgeschlagen", error.message);
});

async function init() {
  if (location.protocol === "file:") {
    els.secureWarning.hidden = false;
    els.secureWarning.textContent =
      "Du öffnest die App über file://. Für echte Geräte bitte https://10.93.10.69:4443 verwenden.";
  }

  if (!window.isSecureContext || !crypto.subtle) {
    els.secureWarning.hidden = false;
    els.createOffer.disabled = true;
    els.acceptSignal.disabled = true;
    els.openWizard.disabled = true;
    setConnection("idle", "Unsicherer Kontext", "Öffne die App über localhost oder HTTPS.");
    return;
  }

  state.db = await openDb();
  state.identity = await loadOrCreateIdentity();
  state.localIdentityKey = b64(state.identity.publicKeySpki);
  state.startupInvite = readInviteFromText(location.href);
  els.displayName.value = localStorage.getItem("displayNameConfirmed") ? (localStorage.getItem("displayName") || "") : "";
  els.signalingServer.value = localStorage.getItem("signalingServer") || DEFAULT_SIGNALING_SERVER;
  localStorage.setItem("signalingServer", normalizeSignalingServer(els.signalingServer.value));
  state.messages = loadMessages();
  state.conversations = loadConversations();
  state.activeChatId = pickInitialChatId();
  ensureConversation(state.activeChatId, "Neuer Chat");
  state.seen = new Set(loadSeenMessageIds());
  els.localFingerprint.textContent = formatFingerprint(await fingerprint(state.identity.publicKeySpki));
  registerServiceWorker();
  renderChatList();
  renderMessages();
  renderSecurity();
  if (!localStorage.getItem("displayNameConfirmed")) {
    window.setTimeout(() => openDeviceNameDialog(), 180);
  } else if (state.startupInvite) {
    window.setTimeout(() => acceptStartupInvite(), 250);
  } else if (!localStorage.getItem("hasSeenSetup")) {
    localStorage.setItem("hasSeenSetup", "1");
    window.setTimeout(() => openSetupDialog(), 250);
  } else {
    window.setTimeout(() => autoReconnectKnownChat(), 450);
  }
}

els.displayName.addEventListener("input", () => {
  localStorage.setItem("displayName", els.displayName.value.trim());
});

els.saveDeviceName.addEventListener("click", () => {
  saveDeviceName();
});

els.deviceNameDialog.addEventListener("submit", (event) => {
  event.preventDefault();
  saveDeviceName();
});

function saveDeviceName() {
  const name = els.deviceNameInput.value.trim();
  if (!name) {
    els.deviceNameInput.setCustomValidity("Bitte gib einen Namen ein.");
    els.deviceNameInput.reportValidity();
    return;
  }
  els.deviceNameInput.setCustomValidity("");
  els.displayName.value = name;
  localStorage.setItem("displayName", name);
  localStorage.setItem("displayNameConfirmed", "1");
  if (els.deviceNameDialog.open) els.deviceNameDialog.close();
  if (state.startupInvite) {
    window.setTimeout(() => acceptStartupInvite(), 120);
  } else if (!localStorage.getItem("hasSeenSetup")) {
    localStorage.setItem("hasSeenSetup", "1");
    window.setTimeout(() => openSetupDialog(), 120);
  }
}

els.signalingServer.addEventListener("input", () => {
  localStorage.setItem("signalingServer", normalizeSignalingServer(els.signalingServer.value));
});

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  state.installPrompt = event;
  els.installApp.hidden = false;
});

els.installApp.addEventListener("click", async () => {
  if (!state.installPrompt) return;
  state.installPrompt.prompt();
  await state.installPrompt.userChoice;
  state.installPrompt = null;
  els.installApp.hidden = true;
});

els.newChat.addEventListener("click", () => {
  const id = `chat-${crypto.randomUUID()}`;
  ensureConversation(id, "Neuer Chat");
  state.pendingDraftChatId = id;
  switchChat(id);
  resetSession(true);
  openSetupDialog();
});

els.createOffer.addEventListener("click", async () => {
  await createOffer();
});

els.acceptSignal.addEventListener("click", async () => {
  await processSignalText(els.remoteSignal.value);
});

els.openWizard.addEventListener("click", () => {
  openSetupDialog();
});

els.reconnectChat.addEventListener("click", async () => {
  await reconnectCurrentChat();
});

els.mobileReconnectChat.addEventListener("click", async () => {
  await reconnectCurrentChat();
});

els.mobileChatSwitch.addEventListener("change", () => {
  switchChat(els.mobileChatSwitch.value);
});

els.connectDialog.addEventListener("close", () => {
  stopQrScan();
  cleanupAbandonedDraftChat();
});

els.mobileSettings.addEventListener("click", () => {
  document.querySelector(".app-shell").classList.toggle("show-settings");
});

els.closeMobileSettings.addEventListener("click", () => {
  document.querySelector(".app-shell").classList.remove("show-settings");
});

els.deleteChat.addEventListener("click", () => {
  deleteCurrentChatForMe();
});

els.wizardStartA.addEventListener("click", async () => {
  await startSignalingInvite();
});

els.wizardStartB.addEventListener("click", async () => {
  await joinInvite(els.wizardInviteInput.value);
});

els.wizardManualA.addEventListener("click", async () => {
  state.wizardRole = "offerer";
  await createOffer();
  els.wizardOfferCode.value = els.localSignal.value;
  renderQr(els.wizardOfferQr, els.wizardOfferQrNote, els.localSignal.value);
  showWizardPage("wizard-offer", 2, "Manuelle Einladung: langen Code an Gerät B senden.");
});

els.wizardManualB.addEventListener("click", () => {
  state.wizardRole = "answerer";
  showWizardPage("wizard-offer-input", 2, "Manuelle Antwort: langen Code von Gerät A einfügen.");
});

els.wizardCopyInvite.addEventListener("click", () => copyText(els.wizardInviteLink));

els.wizardCopyOffer.addEventListener("click", () => copyText(els.wizardOfferCode));

els.wizardOfferNext.addEventListener("click", () => {
  stopQrScan();
  showWizardPage("wizard-answer-input", 3, "Gerät A: Antwort von Gerät B einfügen.");
});

els.wizardScanAnswer.addEventListener("click", () => {
  scanQrTo(els.wizardAnswerVideo, els.wizardAnswerCode, els.wizardScanAnswerState);
});

els.wizardProcessOffer.addEventListener("click", async () => {
  const ok = await processSignalText(els.wizardRemoteOfferCode.value);
  if (!ok) return;
  els.wizardLocalAnswerCode.value = els.localSignal.value;
  renderQr(els.wizardAnswerQr, els.wizardAnswerQrNote, els.localSignal.value);
  showWizardPage("wizard-answer-output", 3, "Gerät B: Antwort zurück an Gerät A senden.");
});

els.wizardScanOffer.addEventListener("click", () => {
  scanQrTo(els.wizardOfferVideo, els.wizardRemoteOfferCode, els.wizardScanOfferState);
});

els.wizardCopyAnswer.addEventListener("click", () => copyText(els.wizardLocalAnswerCode));

els.wizardAnswerWait.addEventListener("click", () => {
  showWizardPage("wizard-wait", 4, "Gerät B wartet auf den verschlüsselten Kanal.");
});

els.wizardProcessAnswer.addEventListener("click", async () => {
  const ok = await processSignalText(els.wizardAnswerCode.value);
  if (!ok) return;
  showWizardPage("wizard-wait", 4, "Gerät A wartet auf den verschlüsselten Kanal.");
});

els.wizardConfirmSas.addEventListener("click", async () => {
  await confirmSas();
});

async function createOffer() {
  resetSession(false);
  setupPeerConnection(true);
  setConnection("connecting", "Einladung wird erstellt", "Netzwerk-Kandidaten werden gesammelt.");
  const offer = await state.pc.createOffer();
  await state.pc.setLocalDescription(offer);
  await waitForIceGathering(state.pc);
  await writeSignal("offer", state.pc.localDescription);
  setConnection(
    "connecting",
    "Einladung bereit",
    `Sende den Code. Kandidaten: ${describeCandidateStats()}.`,
  );
}

function renderQr(canvas, note, value) {
  const qrFactory = window.qrcode;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!qrFactory) {
    note.textContent = "QR-Bibliothek nicht geladen. Nutze den Code darunter.";
    return;
  }

  try {
    const qr = qrFactory(0, "L");
    qr.addData(value);
    qr.make();
    const count = qr.getModuleCount();
    const padding = 12;
    const size = canvas.width;
    const cell = Math.floor((size - padding * 2) / count);
    const offset = Math.floor((size - cell * count) / 2);

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = "#1f2528";
    for (let row = 0; row < count; row += 1) {
      for (let col = 0; col < count; col += 1) {
        if (qr.isDark(row, col)) {
          ctx.fillRect(offset + col * cell, offset + row * cell, cell, cell);
        }
      }
    }
    note.textContent = "QR lokal erzeugt. Nichts wird an einen Server gesendet.";
  } catch (error) {
    console.error(error);
    note.textContent = "Der Code ist zu groß für QR. Nutze Kopieren/Einfügen.";
  }
}

async function scanQrTo(video, target, status) {
  if (!navigator.mediaDevices?.getUserMedia) {
    status.textContent = "Dieser Browser erlaubt keinen Kamerazugriff. Nutze Kopieren/Einfügen.";
    return;
  }

  stopQrScan();
  try {
    const detector = "BarcodeDetector" in window ? new BarcodeDetector({ formats: ["qr_code"] }) : null;
    const qrCanvas = document.createElement("canvas");
    const qrCtx = qrCanvas.getContext("2d", { willReadFrequently: true });
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
    video.srcObject = stream;
    video.hidden = false;
    await video.play();
    status.textContent = "Kamera läuft. Richte sie auf den QR-Code.";

    let stopped = false;
    state.scanStop = () => {
      stopped = true;
      video.pause();
      video.hidden = true;
      for (const track of stream.getTracks()) track.stop();
      state.scanStop = null;
    };

    const tick = async () => {
      if (stopped) return;
      try {
        const value = await detectQr(video, detector, qrCanvas, qrCtx);
        if (value) {
          target.value = value;
          status.textContent = "QR erkannt. Du kannst den Code jetzt verarbeiten.";
          stopQrScan();
          return;
        }
      } catch {
        status.textContent = "QR konnte noch nicht gelesen werden. Halte die Kamera ruhig.";
      }
      window.setTimeout(tick, 350);
    };
    tick();
  } catch (error) {
    status.textContent = `Kamera nicht verfügbar: ${error.message}`;
  }
}

async function detectQr(video, detector, canvas, ctx) {
  if (detector) {
    const codes = await detector.detect(video);
    if (codes.length > 0) return codes[0].rawValue;
  }

  if (!window.jsQR || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return "";
  const width = video.videoWidth;
  const height = video.videoHeight;
  if (!width || !height) return "";
  canvas.width = width;
  canvas.height = height;
  ctx.drawImage(video, 0, 0, width, height);
  const image = ctx.getImageData(0, 0, width, height);
  const result = window.jsQR(image.data, width, height);
  return result?.data || "";
}

function stopQrScan() {
  state.scanStop?.();
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  navigator.serviceWorker.register(`./sw.js?v=${Date.now()}`).catch((error) => {
    console.warn("Service worker registration failed", error);
  });
}

async function processSignalText(value) {
  const signal = await readSignal(value);
  if (!signal) {
    const compact = value.replace(/\s+/g, "");
    const hint = compact.startsWith("z.")
      ? " Dieser Code wurde mit einer alten App-Version erzeugt. Bitte auf beiden Geräten neu laden und einen frischen Code erzeugen."
      : compact.length < 80
        ? " Der Code wirkt abgeschnitten."
        : "";
    alert(`Der eingefügte Code ist ungültig.${hint}`);
    return false;
  }

  try {
    if (signal.kind === "offer") {
      resetSession(false);
      setupPeerConnection(false);
      state.diag.remoteCandidates = countCandidates(signal.description);
      await state.pc.setRemoteDescription(signal.description);
      const answer = await state.pc.createAnswer();
      await state.pc.setLocalDescription(answer);
      await waitForIceGathering(state.pc);
      await writeSignal("answer", state.pc.localDescription);
      setConnection(
        "connecting",
        "Antwort bereit",
        `Sende den Code zurück und lasse dieses Fenster offen. Kandidaten: ${describeCandidateStats()}.`,
      );
      startConnectionWatch();
      return true;
    }

    if (signal.kind === "answer") {
      if (!state.pc || state.pc.signalingState !== "have-local-offer") {
        alert("Diese Antwort passt zu keiner offenen Einladung. Starte den Assistenten neu und erzeuge zuerst eine Einladung.");
        return false;
      }
      state.diag.remoteCandidates = countCandidates(signal.description);
      await state.pc.setRemoteDescription(signal.description);
      setConnection("connecting", "Antwort verarbeitet", `Warte auf den verschlüsselten Kanal. ${describeCandidateStats()}.`);
      startConnectionWatch();
      return true;
    }
  } catch (error) {
    console.error(error);
    alert(`Der Code konnte nicht verarbeitet werden: ${error.message}`);
    setConnection("idle", "Code abgelehnt", "Starte den Assistenten neu und kopiere den frischen Code vollständig.");
    return false;
  }
  return false;
}

function openSetupDialog() {
  if (!requireDeviceName()) return;
  state.wizardRole = "";
  const hashInvite = readInviteFromText(location.href);
  if (hashInvite) {
    els.wizardInviteInput.value = location.href;
  }
  showWizardPage("wizard-choose", 1, "Code oder Link teilen, scannen oder eingeben.");
  if (!els.connectDialog.open) els.connectDialog.showModal();
}

function openDeviceNameDialog() {
  els.deviceNameInput.value = "";
  els.deviceNameInput.setCustomValidity("");
  if (!els.deviceNameDialog.open) els.deviceNameDialog.showModal();
  window.setTimeout(() => els.deviceNameInput.focus(), 50);
}

function hasDeviceName() {
  return Boolean(localStorage.getItem("displayNameConfirmed") && els.displayName.value.trim());
}

function requireDeviceName() {
  if (hasDeviceName()) return true;
  openDeviceNameDialog();
  return false;
}

async function startSignalingInvite() {
  if (!requireDeviceName()) return;
  let serverUrl = normalizeSignalingServer(els.signalingServer.value);
  if (!serverUrl) {
    els.signalingServer.value = DEFAULT_SIGNALING_SERVER;
    serverUrl = normalizeSignalingServer(DEFAULT_SIGNALING_SERVER);
    localStorage.setItem("signalingServer", serverUrl);
  }

  const roomId = shortRoomId();
  const invite = createInvite(roomId, serverUrl);
  els.wizardShortCode.textContent = formatRoomCode(roomId);
  els.wizardInviteLink.value = invite.link;
  renderQr(els.wizardInviteQr, els.wizardInviteQrNote, invite.link);
  rememberSignalingRoom(roomId, serverUrl, true);
  await connectSignaling(roomId, serverUrl, true);
}

async function joinInvite(value) {
  if (!requireDeviceName()) return;
  const invite = readInviteFromText(value);
  if (!invite) {
    const serverUrl = normalizeSignalingServer(els.signalingServer.value);
    const roomId = normalizeRoomCode(value);
    if (!serverUrl || !roomId) {
      setConnection("idle", "Invite fehlt", "Füge einen Invite-Link ein oder trage Server plus Code ein.");
      return;
    }
    rememberSignalingRoom(roomId, serverUrl, false);
    await connectSignaling(roomId, serverUrl, false);
    return;
  }

  els.signalingServer.value = invite.serverUrl;
  localStorage.setItem("signalingServer", invite.serverUrl);
  els.wizardShortCode.textContent = formatRoomCode(invite.roomId);
  els.wizardInviteLink.value = invite.link || value;
  renderQr(els.wizardInviteQr, els.wizardInviteQrNote, invite.link || value);
  rememberSignalingRoom(invite.roomId, invite.serverUrl, false);
  await connectSignaling(invite.roomId, invite.serverUrl, false);
}

async function connectSignaling(roomId, serverUrl, isOfferer) {
  closeSignaling();
  resetSession(false);
  state.signaling = {
    socket: null,
    roomId,
    clientId: crypto.randomUUID(),
    serverUrl,
    isOfferer,
    connectedAt: Date.now(),
    seenSignals: new Set(),
    pendingCandidates: [],
    offerInFlight: false,
    lastRemoteOfferSdp: "",
  };

  const socketUrl = buildSignalingSocketUrl(serverUrl, roomId, state.signaling.clientId);
  setConnection("connecting", "Signaling verbindet", `${formatRoomCode(roomId)} über WebSocket.`);

  const socket = new WebSocket(socketUrl);
  state.signaling.socket = socket;

  socket.addEventListener("open", async () => {
    if (socket !== state.signaling.socket) return;
    sendSignaling({
      type: "join",
      protocol: SIGNALING_PROTOCOL,
      roomId,
      clientId: state.signaling.clientId,
      name: els.displayName.value.trim() || defaultName(),
      role: isOfferer ? "offerer" : "answerer",
    });
    setConnection("connecting", "Signaling bereit", isOfferer ? "Sende WebRTC-Einladung." : "Warte auf WebRTC-Einladung.");
    if (isOfferer) await createOfferForSignaling();
  });

  socket.addEventListener("message", (event) => {
    if (socket !== state.signaling.socket) return;
    handleSignalingMessage(event.data).catch((error) => {
      console.error(error);
      setConnection("idle", "Signaling-Fehler", error.message);
    });
  });

  socket.addEventListener("close", () => {
    if (socket !== state.signaling.socket) return;
    if (!state.sessionKey) {
      setConnection("idle", "Signaling getrennt", "Verlauf bleibt lokal. Zum Senden neu verbinden.");
      renderReconnectButton();
    }
  });

  socket.addEventListener("error", () => {
    if (socket !== state.signaling.socket) return;
    setConnection("idle", "Signaling nicht erreichbar", "Prüfe WebSocket-URL oder nutze Erweitert für manuelle Codes.");
    renderReconnectButton();
  });
}

async function createOfferForSignaling() {
  if (state.signaling.offerInFlight) return;
  if (state.pc?.localDescription) {
    sendSignaling({ type: "signal", kind: "offer", description: state.pc.localDescription });
    setConnection("connecting", "Einladung gesendet", "Peer ist im Raum. Warte auf Antwort.");
    return;
  }

  state.signaling.offerInFlight = true;
  try {
    setupPeerConnection(true);
    const offer = await state.pc.createOffer();
    await state.pc.setLocalDescription(offer);
    sendSignaling({ type: "signal", kind: "offer", description: state.pc.localDescription });
    setConnection("connecting", "Einladung gesendet", "Warte auf Antwort und tausche Netzwerkkandidaten aus.");
    const pc = state.pc;
    startConnectionWatch();
    waitForIceGathering(pc).then(() => {
      if (state.pc === pc && pc.localDescription && pc.signalingState === "have-local-offer") {
        sendSignaling({ type: "signal", kind: "offer", description: pc.localDescription });
      }
    }).catch((error) => console.warn("ICE gathering failed", error));
  } finally {
    state.signaling.offerInFlight = false;
  }
}

async function handleSignalingMessage(raw) {
  const message = JSON.parse(raw);
  if (message.clientId && message.clientId === state.signaling.clientId) return;
  if (message.protocol && message.protocol !== SIGNALING_PROTOCOL) return;

  if (message.type === "room-ready") {
    const peerCount = Array.isArray(message.peers) ? message.peers.length : 0;
    if (state.signaling.isOfferer && peerCount > 0) await createOfferForSignaling();
    return;
  }

  if (message.type === "peer-joined" && state.signaling.isOfferer) {
    await createOfferForSignaling();
    return;
  }

  if (message.type === "signal-ack") return;
  if (message.type === "error") {
    setConnection("idle", "Signaling-Fehler", message.message || "Der Signaling-Server hat die Nachricht abgelehnt.");
    return;
  }
  if (message.type !== "signal") return;

  if (message.id) {
    if (state.signaling.seenSignals.has(message.id)) return;
    state.signaling.seenSignals.add(message.id);
  }

  if (message.kind === "candidate") {
    await queueOrAddRemoteCandidate(message.candidate);
    return;
  }

  if (message.kind === "offer") {
    await handleRemoteOffer(message);
    return;
  }

  if (message.kind === "answer") {
    await handleRemoteAnswer(message);
  }
}

async function handleRemoteOffer(message) {
  if (state.signaling.isOfferer || !message.description) return;
  const remoteSdp = message.description.sdp || "";

  if (state.pc?.remoteDescription?.type === "offer" && state.pc.localDescription) {
    if (state.pc.localDescription) {
      sendSignaling({ type: "signal", kind: "answer", description: state.pc.localDescription });
    }
    return;
  }

  if (state.pc) state.pc.close();
  setupPeerConnection(false);
  state.signaling.lastRemoteOfferSdp = remoteSdp;
  state.diag.remoteCandidates = countCandidates(message.description);
  await state.pc.setRemoteDescription(message.description);
  await flushRemoteCandidates();
  const answer = await state.pc.createAnswer();
  await state.pc.setLocalDescription(answer);
  sendSignaling({ type: "signal", kind: "answer", description: state.pc.localDescription });
  setConnection("connecting", "Antwort gesendet", "Warte auf verschlüsselten Kanal.");
  const pc = state.pc;
  startConnectionWatch();
  await waitForIceGathering(pc);
  if (state.pc === pc && pc.localDescription && pc.signalingState === "stable") {
    sendSignaling({ type: "signal", kind: "answer", description: pc.localDescription });
  }
}

async function handleRemoteAnswer(message) {
  if (!state.pc || !message.description) return;
  if (state.pc.signalingState === "stable") return;
  if (state.pc.signalingState !== "have-local-offer") return;
  state.diag.remoteCandidates = countCandidates(message.description);
  await state.pc.setRemoteDescription(message.description);
  await flushRemoteCandidates();
  setConnection("connecting", "Antwort verarbeitet", "Warte auf verschlüsselten Kanal.");
  startConnectionWatch();
}

async function queueOrAddRemoteCandidate(candidate) {
  if (!candidate?.candidate) return;
  state.diag.remoteCandidates += 1;
  if (!state.pc || !state.pc.remoteDescription) {
    state.signaling.pendingCandidates.push(candidate);
    state.signaling.pendingCandidates = state.signaling.pendingCandidates.slice(-MAX_QUEUED_REMOTE_CANDIDATES);
    return;
  }
  await addRemoteCandidate(candidate);
}

async function flushRemoteCandidates() {
  if (!state.pc?.remoteDescription) return;
  const candidates = state.signaling.pendingCandidates.splice(0);
  for (const candidate of candidates) {
    await addRemoteCandidate(candidate);
  }
}

async function addRemoteCandidate(candidate) {
  try {
    await state.pc.addIceCandidate(new RTCIceCandidate(candidate));
  } catch (error) {
    console.warn("Remote ICE candidate rejected", error);
  }
}

function sendSignaling(message) {
  const socket = state.signaling.socket;
  if (socket?.readyState !== WebSocket.OPEN) return;
  socket.send(JSON.stringify({
    ...message,
    id: message.id || crypto.randomUUID(),
    protocol: SIGNALING_PROTOCOL,
    roomId: state.signaling.roomId,
    clientId: state.signaling.clientId,
    name: els.displayName.value.trim() || defaultName(),
  }));
}

function closeSignaling() {
  if (state.signaling.socket) {
    state.signaling.socket.close();
  }
  state.signaling.socket = null;
}

function normalizeSignalingServer(value) {
  const trimmed = value.trim().replace(/\/+$/, "");
  if (!trimmed) return "";
  if (trimmed.startsWith("https://")) return `wss://${trimmed.slice("https://".length)}`;
  if (trimmed.startsWith("http://")) return `ws://${trimmed.slice("http://".length)}`;
  if (trimmed.startsWith("wss://") || trimmed.startsWith("ws://")) return trimmed;
  return `wss://${trimmed}`;
}

function buildSignalingSocketUrl(serverUrl, roomId, clientId) {
  const url = new URL(`${serverUrl}/room/${encodeURIComponent(roomId)}`);
  url.searchParams.set("client", clientId);
  url.searchParams.set("v", "1");
  return url.toString();
}

function createInvite(roomId, serverUrl) {
  const isDefaultServer = normalizeSignalingServer(serverUrl) === normalizeSignalingServer(DEFAULT_SIGNALING_SERVER);
  const payload = {
    v: 1,
    roomId,
    serverUrl,
    exp: Date.now() + SIGNALING_ROOM_TTL_MS,
  };
  const url = new URL(location.href);
  if (isDefaultServer) {
    const shortUrl = new URL(`/s/${formatRoomCode(roomId).replaceAll(" ", "-")}`, location.origin);
    return { ...payload, link: shortUrl.toString() };
  }
  url.hash = `invite=${b64url(utf8(JSON.stringify(payload)))}`;
  return { ...payload, link: url.toString() };
}

function readInviteFromText(value) {
  const text = value.trim();
  if (!text) return null;
  const directCode = normalizeRoomCode(text);
  if (directCode.length >= 6 && directCode.length <= 32 && !text.includes("/") && !text.includes("#")) {
    return {
      v: 1,
      roomId: directCode,
      serverUrl: normalizeSignalingServer(DEFAULT_SIGNALING_SERVER),
      link: text,
    };
  }
  try {
    const url = new URL(text, location.href);
    const params = new URLSearchParams(url.hash.replace(/^#/, ""));
    const shortHash = params.get("s");
    const pathMatch = url.pathname.match(/^\/s\/(.+)$/i);
    const shortCode = normalizeRoomCode(shortHash || pathMatch?.[1] || "");
    if (shortCode) {
      return {
        v: 1,
        roomId: shortCode,
        serverUrl: normalizeSignalingServer(DEFAULT_SIGNALING_SERVER),
        link: url.toString(),
      };
    }
    const encoded = params.get("invite");
    if (!encoded) return null;
    const invite = JSON.parse(decoder.decode(fromB64url(encoded)));
    if (invite.v !== 1 || !invite.roomId || !invite.serverUrl) return null;
    return {
      ...invite,
      roomId: normalizeRoomCode(invite.roomId),
      serverUrl: normalizeSignalingServer(invite.serverUrl),
      link: url.toString(),
    };
  } catch {
    return null;
  }
}

async function acceptStartupInvite() {
  if (!state.startupInvite || !requireDeviceName()) return;
  localStorage.setItem("hasSeenSetup", "1");
  showWizardPage("wizard-wait", 4, "Invite erkannt. Verbindung wird automatisch aufgebaut.");
  if (!els.connectDialog.open) els.connectDialog.showModal();
  const invite = state.startupInvite;
  state.startupInvite = null;
  els.wizardInviteInput.value = invite.link || location.href;
  els.wizardShortCode.textContent = formatRoomCode(invite.roomId);
  els.wizardInviteLink.value = invite.link || location.href;
  renderQr(els.wizardInviteQr, els.wizardInviteQrNote, invite.link || location.href);
  rememberSignalingRoom(invite.roomId, invite.serverUrl, false);
  await connectSignaling(invite.roomId, invite.serverUrl, false);
}

function shortRoomId() {
  const alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  const bytes = randomBytes(10);
  let out = "";
  for (const byte of bytes) out += alphabet[byte % alphabet.length];
  return out;
}

function normalizeRoomCode(value) {
  return value.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function formatRoomCode(value) {
  return normalizeRoomCode(value).replace(/(.{4})/g, "$1 ").trim() || "------";
}

function rememberSignalingRoom(roomId, serverUrl, isOfferer = null) {
  ensureConversation(state.activeChatId, "Neuer Chat");
  Object.assign(state.conversations[state.activeChatId], {
    signalingRoomId: roomId,
    signalingServer: serverUrl,
    signalingIsOfferer: isOfferer,
    signalingUpdatedAt: Date.now(),
  });
  persistConversations();
}

async function autoReconnectKnownChat() {
  if (!hasDeviceName()) return;
  const conversation = state.conversations[state.activeChatId];
  const serverUrl = normalizeSignalingServer(els.signalingServer.value || conversation?.signalingServer || "");
  if (!conversation?.signalingRoomId || !serverUrl || state.sessionKey || state.signaling.socket) return;
  const isOfferer = reconnectRole(conversation);
  setConnection("connecting", "Reconnect", "Bekannten Chat über Signaling neu aufbauen.");
  await connectSignaling(conversation.signalingRoomId, serverUrl, isOfferer);
}

async function reconnectCurrentChat() {
  if (!requireDeviceName()) return;
  const conversation = state.conversations[state.activeChatId];
  const serverUrl = normalizeSignalingServer(conversation?.signalingServer || els.signalingServer.value || DEFAULT_SIGNALING_SERVER);
  if (!conversation?.signalingRoomId || !serverUrl) {
    openSetupDialog();
    return;
  }
  setConnection("connecting", "Reconnect", "Verbinde den bekannten Chat neu.");
  await connectSignaling(conversation.signalingRoomId, serverUrl, reconnectRole(conversation));
}

function reconnectRole(conversation) {
  if (typeof conversation?.signalingIsOfferer === "boolean") return conversation.signalingIsOfferer;
  return !conversation?.peerIdentityKey || state.localIdentityKey < conversation.peerIdentityKey;
}

els.copyLocal.addEventListener("click", async () => {
  await copyText(els.localSignal);
});

els.clearLocal.addEventListener("click", () => {
  els.localSignal.value = "";
});

els.resetSession.addEventListener("click", () => resetSession(true));

els.confirmSas.addEventListener("click", async () => {
  await confirmSas();
});

async function confirmSas() {
  state.localSasConfirmed = true;
  await sendSecure({ kind: "sas-confirmed" }, { trackAck: false });
  await trustRemoteIdentity();
  renderSecurity();
}

els.form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const body = els.messageInput.value.trim();
  if (!body || !canSendUserData()) return;
  els.messageInput.value = "";
  const id = crypto.randomUUID();
  addMessage({
    id,
    direction: "out",
    body,
    status: "pending",
    createdAt: Date.now(),
    senderIdentityKey: state.localIdentityKey,
    senderName: els.displayName.value.trim() || defaultName(),
  });
  await sendSecure({ kind: "chat", id, body, createdAt: Date.now() }, { messageId: id });
});

els.fileInput.addEventListener("change", async () => {
  const file = els.fileInput.files?.[0];
  els.fileInput.value = "";
  if (!file || !canSendUserData()) return;
  await sendFile(file);
});

function setupPeerConnection(isOfferer) {
  state.diag = {
    localCandidates: 0,
    remoteCandidates: 0,
    candidateTypes: new Set(),
    channelOpen: false,
    lastIceState: "new",
    lastPeerState: "new",
  };
  state.pc = new RTCPeerConnection({
    iceServers: ICE_SERVERS,
    iceCandidatePoolSize: 4,
  });
  state.pc.addEventListener("icecandidate", (event) => {
    if (!event.candidate) return;
    state.diag.localCandidates += 1;
    const match = event.candidate.candidate.match(/ typ ([a-z]+)/);
    if (match) state.diag.candidateTypes.add(match[1]);
    if (state.signaling.socket?.readyState === WebSocket.OPEN) {
      sendSignaling({ type: "signal", kind: "candidate", candidate: event.candidate.toJSON() });
    }
    updateWizardFromConnection();
  });
  state.pc.addEventListener("connectionstatechange", () => {
    const status = state.pc.connectionState;
    state.diag.lastPeerState = status;
    if (status === "connected") setConnection("connecting", "P2P verbunden", "Starte kryptografischen Handshake.");
    if (["failed", "disconnected", "closed"].includes(status)) {
      setConnection("idle", "Verbindung unterbrochen", buildConnectionFailureText());
      renderMessages();
    }
    updateWizardFromConnection();
  });
  state.pc.addEventListener("iceconnectionstatechange", () => {
    state.diag.lastIceState = state.pc.iceConnectionState;
    if (["failed", "disconnected"].includes(state.pc.iceConnectionState)) {
      setConnection(
        "idle",
        "P2P-Verbindung blockiert",
        buildConnectionFailureText(),
      );
    }
    updateWizardFromConnection();
  });

  if (isOfferer) {
    state.channel = state.pc.createDataChannel("lan-secure-chat", { ordered: true });
    configureChannel();
  } else {
    state.pc.addEventListener("datachannel", (event) => {
      state.channel = event.channel;
      configureChannel();
    });
  }
}

function configureChannel() {
  state.channel.binaryType = "arraybuffer";
  state.channel.addEventListener("open", async () => {
    state.diag.channelOpen = true;
    setConnection("connecting", "Datenkanal offen", "Tausche signierte Session-Keys aus.");
    await sendHello();
  });
  state.channel.addEventListener("message", (event) => receiveFrame(event.data));
  state.channel.addEventListener("close", () => {
    setConnection("idle", "Datenkanal geschlossen", "Erstelle bei Bedarf eine neue Einladung.");
  });
}

async function sendHello() {
  const eph = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]);
  const ephSpki = await crypto.subtle.exportKey("spki", eph.publicKey);
  state.localHello = {
    version: 1,
    kind: "crypto-hello",
    name: els.displayName.value.trim() || defaultName(),
    identityKey: b64(state.identity.publicKeySpki),
    ephKey: b64(ephSpki),
    nonce: b64(randomBytes(24)),
  };
  state.localHello.signature = b64(
    await crypto.subtle.sign(
      { name: "ECDSA", hash: "SHA-256" },
      state.identity.privateKey,
      utf8(canonical(unsignedHello(state.localHello))),
    ),
  );
  state.localHello.privateEph = eph.privateKey;
  sendPlain(publicHello(state.localHello));
  await maybeEstablishSession();
}

async function receiveFrame(raw) {
  const frame = JSON.parse(raw);
  if (frame.kind === "crypto-hello") {
    await handleHello(frame);
    return;
  }
  if (frame.kind === "secure") {
    await receiveSecure(frame);
  }
}

async function handleHello(hello) {
  const publicKey = await crypto.subtle.importKey(
    "spki",
    fromB64(hello.identityKey),
    { name: "ECDSA", namedCurve: "P-256" },
    true,
    ["verify"],
  );
  const signatureOk = await crypto.subtle.verify(
    { name: "ECDSA", hash: "SHA-256" },
    publicKey,
    fromB64(hello.signature),
    utf8(canonical(unsignedHello(hello))),
  );
  if (!signatureOk) {
    setConnection("idle", "Handshake abgelehnt", "Die Identity-Signatur ist ungültig.");
    return;
  }
  state.remoteHello = hello;
  state.remoteIdentityKey = publicKey;
  state.remoteName = hello.name || "Peer";
  const remoteFingerprint = formatFingerprint(await fingerprint(fromB64(hello.identityKey)));
  els.remoteFingerprint.textContent = remoteFingerprint;
  bindConversationToPeer(hello, remoteFingerprint);
  renderSecurity();
  await maybeEstablishSession();
}

async function maybeEstablishSession() {
  if (!state.localHello || !state.remoteHello || state.sessionKey) return;
  const remoteEph = await crypto.subtle.importKey(
    "spki",
    fromB64(state.remoteHello.ephKey),
    { name: "ECDH", namedCurve: "P-256" },
    true,
    [],
  );
  const sharedBits = await crypto.subtle.deriveBits(
    { name: "ECDH", public: remoteEph },
    state.localHello.privateEph,
    256,
  );
  const transcript = canonical(
    [publicHello(state.localHello), state.remoteHello].sort((a, b) =>
      a.identityKey.localeCompare(b.identityKey),
    ),
  );
  const transcriptHash = await sha256(utf8(transcript));
  const keyMaterial = await crypto.subtle.importKey("raw", sharedBits, "HKDF", false, ["deriveKey"]);
  state.sessionKey = await crypto.subtle.deriveKey(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: transcriptHash,
      info: utf8("lan-secure-chat-v1/aes-gcm"),
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
  const sasBytes = await sha256(concatBytes(utf8("sas"), transcriptHash, new Uint8Array(sharedBits)));
  const sessionBytes = await sha256(concatBytes(utf8("session"), transcriptHash));
  state.sas = digitsFromBytes(sasBytes);
  state.sessionId = b64url(sessionBytes.slice(0, 16));
  state.sessions.set(state.activeChatId, {
    chatId: state.activeChatId,
    pc: state.pc,
    channel: state.channel,
    sessionId: state.sessionId,
    remoteIdentityKey: state.remoteHello.identityKey,
    remoteName: state.remoteName,
    pending: state.pending,
    files: state.files,
    establishedAt: Date.now(),
  });
  window.clearTimeout(state.connectionWatch);
  state.connectionWatch = null;
  setConnection("secure", "Verschlüsselte Sitzung bereit", "Vergleiche den Sicherheitscode vor der ersten Nachricht.");
  renderReconnectButton();
  renderSecurity();
}

async function sendSecure(payload, options = {}) {
  if (!state.sessionKey || state.channel?.readyState !== "open") return;
  const securePayload = await signPayloadIfNeeded(payload);
  const messageId = options.messageId || crypto.randomUUID();
  const seq = ++state.sendSeq;
  const nonce = randomBytes(12);
  const header = { kind: "secure", id: messageId, seq, sessionId: state.sessionId, nonce: b64(nonce) };
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: nonce, additionalData: utf8(canonical(header)) },
    state.sessionKey,
    utf8(canonical(securePayload)),
  );
  const frame = { ...header, ciphertext: b64(ciphertext) };
  sendPlain(frame);
  if (options.trackAck !== false) {
    trackPending(messageId, frame, options.onFailed);
  }
}

async function receiveSecure(frame) {
  if (!state.sessionKey || frame.sessionId !== state.sessionId) return;
  const header = {
    kind: frame.kind,
    id: frame.id,
    seq: frame.seq,
    sessionId: frame.sessionId,
    nonce: frame.nonce,
  };
  let payload;
  try {
    const plain = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: fromB64(frame.nonce), additionalData: utf8(canonical(header)) },
      state.sessionKey,
      fromB64(frame.ciphertext),
    );
    payload = JSON.parse(decoder.decode(plain));
  } catch {
    setConnection("idle", "Nachricht verworfen", "Authentifizierung oder Entschlüsselung fehlgeschlagen.");
    return;
  }

  if (payload.kind === "ack") {
    acknowledge(payload.ackId);
    return;
  }

  if (!(await verifyPayloadSignatureIfNeeded(payload))) {
    setConnection("idle", "Nachricht verworfen", "Sender-Signatur konnte nicht geprüft werden.");
    return;
  }

  if (state.seen.has(frame.id)) {
    await sendSecure({ kind: "ack", ackId: frame.id }, { trackAck: false });
    return;
  }
  state.seen.add(frame.id);
  persistSeenMessageIds();
  await sendSecure({ kind: "ack", ackId: frame.id }, { trackAck: false });
  await handlePayload(payload);
}

async function handlePayload(payload) {
  if (payload.kind === "sas-confirmed") {
    state.remoteSasConfirmed = true;
    renderSecurity();
    return;
  }
  if (payload.kind === "chat" && canAcceptUserData()) {
    addMessage({
      id: payload.id,
      direction: "in",
      body: payload.body,
      status: "delivered",
      createdAt: payload.createdAt || Date.now(),
      senderIdentityKey: payload.senderIdentityKey,
      senderName: payload.senderName,
    });
    return;
  }
  if (payload.kind === "message-edit" && canAcceptUserData()) {
    applyRemoteMessageEdit(payload);
    return;
  }
  if (payload.kind === "message-delete" && canAcceptUserData()) {
    applyRemoteMessageDelete(payload);
    return;
  }
  if (payload.kind === "file-meta" && canAcceptUserData()) {
    state.files.set(payload.id, {
      meta: payload,
      chunks: [],
      received: 0,
    });
    renderTransfers();
    return;
  }
  if (payload.kind === "file-chunk" && canAcceptUserData()) {
    const file = state.files.get(payload.id);
    if (!file) return;
    const chunk = fromB64(payload.bytes);
    file.chunks[payload.index] = chunk;
    file.received += chunk.byteLength;
    renderTransfers();
    return;
  }
  if (payload.kind === "file-end" && canAcceptUserData()) {
    const file = state.files.get(payload.id);
    if (!file) return;
    const blob = new Blob(file.chunks, { type: file.meta.mime || "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    addMessage({
      id: payload.id,
      direction: "in",
      body: "Datei empfangen",
      status: "delivered",
      createdAt: Date.now(),
      download: { url, name: file.meta.name },
      file: {
        url,
        name: file.meta.name,
        size: file.meta.size,
        type: file.meta.mime || "application/octet-stream",
        status: "empfangen",
      },
      senderIdentityKey: file.meta.senderIdentityKey,
      senderName: file.meta.senderName,
    });
    state.files.delete(payload.id);
    renderTransfers();
  }
}

async function sendFile(file) {
  const id = crypto.randomUUID();
  addTransfer(id, `Sende ${file.name}`, 0);
  await sendSecure({
    kind: "file-meta",
    id,
    name: file.name,
    size: file.size,
    mime: file.type,
    createdAt: Date.now(),
  });
  let offset = 0;
  let index = 0;
  while (offset < file.size) {
    const chunk = await file.slice(offset, offset + FILE_CHUNK_SIZE).arrayBuffer();
    await waitForBufferedAmount();
    await sendSecure({
      kind: "file-chunk",
      id,
      index,
      bytes: b64(chunk),
    });
    offset += chunk.byteLength;
    index += 1;
    addTransfer(id, `Sende ${file.name}`, offset / file.size);
  }
  await sendSecure({ kind: "file-end", id }, { messageId: id });
  const url = URL.createObjectURL(file);
  addMessage({
    id,
    direction: "out",
    body: "Datei gesendet",
    status: "pending",
    createdAt: Date.now(),
    download: { url, name: file.name },
    file: {
      url,
      name: file.name,
      size: file.size,
      type: file.type || "application/octet-stream",
      status: "gesendet",
    },
    senderIdentityKey: state.localIdentityKey,
    senderName: els.displayName.value.trim() || defaultName(),
  });
}

function trackPending(id, frame, onFailed) {
  const pending = {
    frame,
    attempts: 0,
    timer: null,
    onFailed,
  };
  const retry = () => {
    if (!state.pending.has(id)) return;
    pending.attempts += 1;
    if (pending.attempts > MAX_RETRIES) {
      state.pending.delete(id);
      markMessage(id, "failed");
      onFailed?.();
      return;
    }
    if (state.channel?.readyState === "open") sendPlain(frame);
    pending.timer = window.setTimeout(retry, ACK_TIMEOUT_MS * pending.attempts);
  };
  state.pending.set(id, pending);
  pending.timer = window.setTimeout(retry, ACK_TIMEOUT_MS);
}

function acknowledge(id) {
  const pending = state.pending.get(id);
  if (!pending) return;
  window.clearTimeout(pending.timer);
  state.pending.delete(id);
  markMessage(id, "delivered");
}

function resetSession(clearSignals) {
  for (const pending of state.pending.values()) window.clearTimeout(pending.timer);
  window.clearTimeout(state.connectionWatch);
  window.clearTimeout(state.wizardCloseTimer);
  state.pending.clear();
  if (clearSignals) closeSignaling();
  state.pc?.close();
  Object.assign(state, {
    pc: null,
    channel: null,
    localHello: null,
    remoteHello: null,
    remoteIdentityKey: null,
    remoteName: "",
    sessionKey: null,
    sessionId: "",
    sas: "",
    sendSeq: 0,
    receiveSeq: 0,
    localSasConfirmed: false,
    remoteSasConfirmed: false,
    files: new Map(),
    connectionWatch: null,
    wizardCloseTimer: null,
    flushingOutbox: false,
  });
  state.sessions.delete(state.activeChatId);
  if (clearSignals) {
    els.localSignal.value = "";
    els.remoteSignal.value = "";
  }
  els.remoteFingerprint.textContent = "unbekannt";
  setConnection("idle", "Nicht verbunden", "Erstelle eine Einladung oder füge eine Einladung ein.");
  renderReconnectButton();
  renderSecurity();
}

function startConnectionWatch() {
  window.clearTimeout(state.connectionWatch);
  state.connectionWatch = window.setTimeout(() => {
    if (state.sessionKey) return;
    setConnection(
      "idle",
      "Kanal nicht aufgebaut",
      buildConnectionFailureText(),
    );
    els.wizardWaitState.textContent = buildConnectionFailureText();
    updateWizardFromConnection();
  }, CONNECTION_TIMEOUT_MS);
}

function sendPlain(frame) {
  state.channel.send(JSON.stringify(frame));
}

async function writeSignal(kind, description) {
  const packed = await packSignal({ v: 2, kind, description });
  els.localSignal.value = packed;
}

async function readSignal(value) {
  try {
    const parsed = await unpackSignal(value.replace(/\s+/g, ""));
    if (![1, 2].includes(parsed.v) || !["offer", "answer"].includes(parsed.kind)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function waitForIceGathering(pc) {
  if (pc.iceGatheringState === "complete") return Promise.resolve();
  return new Promise((resolve) => {
    let finished = false;
    const done = () => {
      if (!finished && pc.iceGatheringState === "complete") {
        finished = true;
        pc.removeEventListener("icegatheringstatechange", done);
        resolve();
      }
    };
    pc.addEventListener("icegatheringstatechange", done);
    const interval = window.setInterval(() => {
      if (pc.localDescription) {
        setConnection(
          "connecting",
          "Netzwerk wird vorbereitet",
          `Sammle Kandidaten: ${describeCandidateStats()}.`,
        );
      }
    }, 700);
    window.setTimeout(() => {
      if (finished) return;
      finished = true;
      window.clearInterval(interval);
      pc.removeEventListener("icegatheringstatechange", done);
      resolve();
    }, ICE_GATHER_TIMEOUT_MS);
  });
}

async function waitForBufferedAmount() {
  while (state.channel?.bufferedAmount > 256 * 1024) {
    await new Promise((resolve) => window.setTimeout(resolve, 60));
  }
}

function canSendUserData() {
  return Boolean(state.sessionKey && state.localSasConfirmed && state.remoteSasConfirmed);
}

function canAcceptUserData() {
  return canSendUserData();
}

async function trustRemoteIdentity() {
  if (!state.remoteHello) return;
  const trusted = JSON.parse(localStorage.getItem("trustedPeers") || "{}");
  trusted[state.remoteHello.identityKey] = {
    name: state.remoteName,
    fingerprint: els.remoteFingerprint.textContent,
    trustedAt: new Date().toISOString(),
  };
  localStorage.setItem("trustedPeers", JSON.stringify(trusted));
  if (state.conversations[state.activeChatId]) {
    Object.assign(state.conversations[state.activeChatId], {
      trustStatus: "verified",
      lastVerifiedFingerprint: els.remoteFingerprint.textContent,
      peerIdentityKey: state.remoteHello.identityKey,
    });
    persistConversations();
  }
}

function renderSecurity() {
  els.sasCode.textContent = state.sas || "------";
  els.sessionKeyId.textContent = state.sessionId || "keine aktive Session";
  els.wizardSasCode.textContent = state.sas || "------";
  els.confirmSas.disabled = !state.sessionKey || state.localSasConfirmed;
  els.wizardConfirmSas.disabled = !state.sessionKey || state.localSasConfirmed;
  els.messageInput.disabled = !canSendUserData();
  els.sendMessage.disabled = !canSendUserData();
  document.querySelector(".file-button").classList.toggle("disabled", !canSendUserData());
  els.peerSummary.textContent = state.remoteName
    ? `${state.remoteName} · ${state.sessionId || "Session im Aufbau"}`
    : state.messages.some((message) => message.chatId === state.activeChatId)
      ? "Verlauf geladen · zum Senden neu verbinden"
      : "Noch kein Peer verbunden";

  setCheck(els.checks.identity, !!state.remoteHello, "Identity Key empfangen", "Warte auf Peer-Identity");
  setCheck(els.checks.signature, !!state.remoteHello, "Identity-Signatur gültig", "Warte auf signierten Handshake");
  setCheck(els.checks.session, !!state.sessionKey, "Session Key abgeleitet", "Warte auf Session-Key");
  setCheck(
    els.checks.verified,
    canSendUserData(),
    "Beidseitig SAS-verifiziert",
    state.localSasConfirmed ? "Warte auf Peer-Bestätigung" : "Warte auf SAS-Bestätigung",
  );

  els.securityPill.textContent = canSendUserData()
    ? "Verifiziert"
    : state.sessionKey
      ? "Verschlüsselt, nicht verifiziert"
      : "Nicht verifiziert";
  els.securityPill.className = `pill ${canSendUserData() ? "verified" : state.sessionKey ? "secure" : ""}`;
  renderChatList();
  flushPendingOutbox();
  maybeAutoCloseWizard();
  updateWizardFromConnection();
}

function showWizardPage(id, step, subtitle) {
  stopQrScan();
  for (const page of els.wizardPages) page.hidden = page.id !== id;
  els.wizardDots.forEach((dot, index) => dot.classList.toggle("active", index < step));
  els.wizardSubtitle.textContent = subtitle;
  updateWizardFromConnection();
}

function updateWizardFromConnection() {
  if (!els.connectDialog.open) return;

  const securePageVisible = !document.querySelector("#wizard-secure").hidden;
  if (state.sessionKey && !securePageVisible) {
    showWizardPage("wizard-secure", 4, "Verschlüsselter Kanal bereit. Vergleicht den Code.");
    return;
  }

  if (!state.sessionKey) {
    els.wizardWaitState.textContent = state.pc
      ? `Warte auf den verschlüsselten Kanal. ${describeCandidateStats()}.`
      : "Noch keine Verbindung gestartet.";
    els.wizardSecureState.textContent = state.pc
      ? "Warte auf den verschlüsselten Kanal. Beide Geräte müssen die Codes verarbeitet haben."
      : "Noch keine Verbindung gestartet.";
    return;
  }

  if (canSendUserData()) {
    els.wizardSecureState.textContent = "Verbindung bestätigt. Der Chat ist freigeschaltet.";
    maybeAutoCloseWizard();
    return;
  }

  els.wizardSecureState.textContent = state.localSasConfirmed
    ? "Dein Code ist bestätigt. Warte auf die Bestätigung des anderen Geräts."
    : "Vergleiche den Code auf beiden Geräten und bestätige nur bei Übereinstimmung.";
}

function maybeAutoCloseWizard() {
  if (!canSendUserData() || !els.connectDialog.open || state.wizardCloseTimer) return;
  els.wizardSecureState.textContent = "Verbindung bestätigt. Der Chat öffnet sich jetzt.";
  state.wizardCloseTimer = window.setTimeout(() => {
    state.wizardCloseTimer = null;
    if (els.connectDialog.open && canSendUserData()) {
      els.connectDialog.close();
    }
  }, 900);
}

async function copyText(textarea) {
  if (!textarea.value) return;
  try {
    await navigator.clipboard.writeText(textarea.value);
  } catch {
    textarea.focus();
    textarea.select();
  }
}

function renderMessages() {
  els.messages.innerHTML = "";
  const visibleMessages = state.messages.filter((message) => message.chatId === state.activeChatId);
  if (visibleMessages.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty";
    empty.textContent =
      "Noch keine Nachrichten. Koppelt zwei Browser, vergleicht den Sicherheitscode und startet dann den verschlüsselten Chat.";
    els.messages.append(empty);
    return;
  }
  for (const message of visibleMessages) {
    const item = document.createElement("article");
    item.className = `message ${message.direction === "out" ? "mine" : ""} ${message.status} ${message.deleted ? "deleted" : ""}`;
    if (message.file) {
      item.append(renderFileCard(message));
    } else {
      const body = document.createElement("div");
      body.textContent = message.deleted ? "Nachricht gelöscht" : message.body;
      item.append(body);
    }
    item.append(renderMessageActions(message));
    if (message.download && !message.file) {
      const link = document.createElement("a");
      link.href = message.download.url;
      link.download = message.download.name;
      link.textContent = "Herunterladen";
      item.append(link);
    }
    const meta = document.createElement("div");
    meta.className = "meta";
    const edited = message.editedAt ? " · bearbeitet" : "";
    meta.innerHTML = `<span>${new Date(message.createdAt).toLocaleTimeString()}${edited}</span><span class="status">${statusText(message.status)}</span>`;
    item.append(meta);
    els.messages.append(item);
  }
  els.messages.scrollTop = els.messages.scrollHeight;
}

function renderMessageActions(message) {
  const menu = document.createElement("details");
  menu.className = "message-actions";
  if (message.deleted) return menu;

  const summary = document.createElement("summary");
  summary.setAttribute("aria-label", "Nachrichtenaktionen");
  summary.textContent = "⋯";
  menu.append(summary);

  const actions = document.createElement("div");
  actions.className = "message-action-menu";

  if (message.direction === "out" && !message.file) {
    const edit = document.createElement("button");
    edit.type = "button";
    edit.textContent = "Bearbeiten";
    edit.disabled = !canSendUserData();
    edit.addEventListener("click", () => editMessageForEveryone(message.id));
    actions.append(edit);
  }

  if (message.direction === "out") {
    const deleteAll = document.createElement("button");
    deleteAll.type = "button";
    deleteAll.className = "danger-action";
    deleteAll.textContent = "Für alle löschen";
    deleteAll.disabled = !canSendUserData();
    deleteAll.addEventListener("click", () => deleteMessageForEveryone(message.id));
    actions.append(deleteAll);
  }

  const deleteLocal = document.createElement("button");
  deleteLocal.type = "button";
  deleteLocal.textContent = "Nur hier löschen";
  deleteLocal.addEventListener("click", () => deleteMessageForMe(message.id));
  actions.append(deleteLocal);
  menu.append(actions);
  return menu;
}

function renderTransfers() {
  els.transfers.innerHTML = "";
  const files = [...state.files.values()];
  if (files.length === 0) {
    els.transfers.innerHTML = "<p>Keine aktiven Transfers</p>";
    return;
  }
  for (const file of files) {
    addTransfer(file.meta.id, `Empfange ${file.meta.name}`, file.received / file.meta.size);
  }
}

function renderFileCard(message) {
  const card = document.createElement("div");
  card.className = "file-card";
  const file = message.file;
  const title = document.createElement("strong");
  title.textContent = file.name;
  const details = document.createElement("span");
  details.textContent = `${formatBytes(file.size)} · ${file.type || "Datei"} · ${file.status || statusText(message.status)}`;
  card.append(title, details);

  const preview = createFilePreview(file);
  if (preview) card.append(preview);

  if (file.url) {
    const link = document.createElement("a");
    link.href = file.url;
    link.download = file.name;
    link.textContent = "Herunterladen";
    card.append(link);
  } else {
    const note = document.createElement("span");
    note.textContent = "Vorschau nach dem Neuladen nicht mehr im Speicher.";
    card.append(note);
  }
  return card;
}

function createFilePreview(file) {
  if (!file.url) return null;
  if (file.type.startsWith("image/")) {
    const img = document.createElement("img");
    img.className = "file-preview";
    img.src = file.url;
    img.alt = file.name;
    return img;
  }
  if (file.type.startsWith("audio/")) {
    const audio = document.createElement("audio");
    audio.className = "file-preview";
    audio.controls = true;
    audio.src = file.url;
    return audio;
  }
  if (file.type.startsWith("video/")) {
    const video = document.createElement("video");
    video.className = "file-preview";
    video.controls = true;
    video.src = file.url;
    return video;
  }
  if (file.type === "application/pdf" || file.type.startsWith("text/")) {
    const frame = document.createElement("iframe");
    frame.className = "file-preview";
    frame.title = file.name;
    frame.src = file.url;
    return frame;
  }
  return null;
}

function formatBytes(bytes = 0) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function addTransfer(id, label, progress) {
  const existing = document.querySelector(`[data-transfer="${id}"]`);
  const row = existing || document.createElement("div");
  row.className = "transfer";
  row.dataset.transfer = id;
  row.innerHTML = `<p>${label}</p><div class="bar"><span style="width:${Math.round(progress * 100)}%"></span></div>`;
  if (!existing) {
    if (els.transfers.querySelector("p")) els.transfers.innerHTML = "";
    els.transfers.append(row);
  }
}

function addMessage(message) {
  state.messages.push({ ...message, chatId: message.chatId || state.activeChatId });
  touchConversation(state.activeChatId);
  persistMessages();
  renderChatList();
  renderMessages();
}

async function editMessageForEveryone(id) {
  const message = state.messages.find((entry) => entry.id === id && entry.chatId === state.activeChatId);
  if (!message || message.direction !== "out" || message.deleted || !canSendUserData()) return;
  const body = window.prompt("Nachricht bearbeiten", message.body)?.trim();
  if (!body || body === message.body) return;
  message.body = body;
  message.editedAt = Date.now();
  persistMessages();
  renderMessages();
  await sendSecure(
    { kind: "message-edit", id, body, editedAt: message.editedAt },
    { trackAck: false },
  );
}

async function deleteMessageForEveryone(id) {
  const message = state.messages.find((entry) => entry.id === id && entry.chatId === state.activeChatId);
  if (!message || message.direction !== "out" || !canSendUserData()) return;
  if (!window.confirm("Diese Nachricht für alle löschen?")) return;
  markMessageDeleted(message);
  persistMessages();
  renderMessages();
  await sendSecure(
    { kind: "message-delete", id, deletedAt: Date.now() },
    { trackAck: false },
  );
}

function deleteMessageForMe(id) {
  state.messages = state.messages.filter((message) => !(message.id === id && message.chatId === state.activeChatId));
  touchConversation(state.activeChatId);
  persistMessages();
  renderChatList();
  renderMessages();
}

function applyRemoteMessageEdit(payload) {
  const message = state.messages.find(
    (entry) =>
      entry.id === payload.id &&
      entry.chatId === state.activeChatId &&
      entry.direction === "in" &&
      !entry.deleted,
  );
  if (!message) return;
  message.body = payload.body;
  message.editedAt = payload.editedAt || Date.now();
  persistMessages();
  renderMessages();
}

function applyRemoteMessageDelete(payload) {
  const message = state.messages.find(
    (entry) => entry.id === payload.id && entry.chatId === state.activeChatId && entry.direction === "in",
  );
  if (!message) return;
  markMessageDeleted(message);
  persistMessages();
  renderMessages();
}

function markMessageDeleted(message) {
  message.deleted = true;
  message.body = "";
  message.file = undefined;
  message.download = undefined;
  message.deletedAt = Date.now();
}

function deleteCurrentChatForMe() {
  const id = state.activeChatId;
  if (!state.conversations[id]) return;
  if (!window.confirm("Diesen Chat nur in diesem Browser löschen?")) return;
  if (state.sessions.has(id) || state.sessionKey) resetSession(true);
  state.messages = state.messages.filter((message) => message.chatId !== id);
  delete state.conversations[id];
  state.sessions.delete(id);
  if (state.activeChatId === id) {
    state.activeChatId = visibleConversations()[0]?.id || "default";
    ensureConversation(state.activeChatId, "Aktueller Chat");
  }
  persistMessages();
  persistConversations();
  renderChatList();
  renderMessages();
  renderSecurity();
}

function markMessage(id, status) {
  const message = state.messages.find((entry) => entry.id === id);
  if (message) {
    message.status = status;
    if (message.file) message.file.status = statusText(status);
    persistMessages();
    renderChatList();
    renderMessages();
  }
}

function loadMessages() {
  try {
    return JSON.parse(localStorage.getItem("messageHistory") || "[]").map((message) => ({
      ...message,
      chatId: message.chatId || "default",
      download: undefined,
      file: message.file ? { ...message.file, url: undefined } : undefined,
    }));
  } catch {
    return [];
  }
}

function persistMessages() {
  const serializable = state.messages.slice(-500).map(({ download, ...message }) => ({
    ...message,
    file: message.file ? { ...message.file, url: undefined } : undefined,
  }));
  localStorage.setItem("messageHistory", JSON.stringify(serializable));
}

function loadConversations() {
  try {
    const saved = JSON.parse(localStorage.getItem("conversations") || "{}");
    if (Object.keys(saved).length) return saved;
  } catch {
    // Fall through to migration.
  }
  return {
    default: {
      id: "default",
      name: "Aktueller Chat",
      peerFingerprint: "",
      updatedAt: Date.now(),
    },
  };
}

function pickInitialChatId() {
  const saved = localStorage.getItem("activeChatId");
  if (saved && state.conversations[saved] && !isEmptyDraftConversation(saved)) return saved;
  return visibleConversations()[0]?.id || "default";
}

function persistConversations() {
  localStorage.setItem("conversations", JSON.stringify(state.conversations));
  localStorage.setItem("activeChatId", state.activeChatId);
}

function ensureConversation(id, name) {
  if (!state.conversations[id]) {
    state.conversations[id] = {
      id,
      name,
      peerFingerprint: "",
      updatedAt: Date.now(),
    };
  }
  persistConversations();
}

function bindConversationToPeer(hello, remoteFingerprint) {
  const peerId = `peer-${hello.identityKey}`;
  const current = state.conversations[state.activeChatId];
  if (current?.peerIdentityKey && current.peerIdentityKey !== hello.identityKey) {
    addMessage({
      id: crypto.randomUUID(),
      direction: "in",
      body: "Warnung: Der bekannte Peer zeigt einen anderen Identity-Key. Vor dem Senden Fingerprint prüfen.",
      status: "delivered",
      createdAt: Date.now(),
    });
    setConnection("idle", "Identity-Wechsel erkannt", "Fingerprint prüfen, bevor du vertraust.");
  }
  if (state.activeChatId !== peerId) {
    ensureConversation(peerId, hello.name || "Peer");
    if (state.pendingDraftChatId === state.activeChatId) state.pendingDraftChatId = "";
    const oldId = state.activeChatId;
    for (const message of state.messages) {
      if (message.chatId === oldId && state.conversations[oldId]?.name === "Neuer Chat") {
        message.chatId = peerId;
      }
    }
    deleteEmptyDraftConversation(oldId);
    state.activeChatId = peerId;
  }
  Object.assign(state.conversations[state.activeChatId], {
    name: hello.name || "Peer",
    peerFingerprint: remoteFingerprint,
    peerIdentityKey: hello.identityKey,
    trustStatus: state.conversations[state.activeChatId].trustStatus || "unverified",
    lastVerifiedFingerprint: state.conversations[state.activeChatId].lastVerifiedFingerprint || "",
    updatedAt: Date.now(),
  });
  persistConversations();
  persistMessages();
  renderChatList();
  renderMessages();
}

function deleteEmptyDraftConversation(id) {
  if (id === "default") return;
  const hasMessages = state.messages.some((message) => message.chatId === id);
  if (!hasMessages && state.conversations[id]?.name === "Neuer Chat") {
    delete state.conversations[id];
  }
}

function touchConversation(id) {
  ensureConversation(id, "Neuer Chat");
  state.conversations[id].updatedAt = Date.now();
  persistConversations();
}

function switchChat(id) {
  if (!state.conversations[id]) return;
  state.activeChatId = id;
  persistConversations();
  renderChatList();
  renderMessages();
  renderSecurity();
}

function renderChatList() {
  els.chatList.innerHTML = "";
  els.mobileChatSwitch.innerHTML = "";
  const conversations = visibleConversations();
  els.mobileChatSwitch.hidden = conversations.length <= 1;
  for (const conversation of conversations) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `chat-list-item ${conversation.id === state.activeChatId ? "active" : ""}`;
    const count = state.messages.filter((message) => message.chatId === conversation.id).length;
    button.innerHTML = `<strong></strong><small></small>`;
    button.querySelector("strong").textContent = conversation.name || "Chat";
    button.querySelector("small").textContent =
      conversation.id === state.activeChatId && canSendUserData()
        ? "verbunden"
        : count > 0
          ? `${count} Nachricht${count === 1 ? "" : "en"} · neu verbinden`
          : "leer";
    button.addEventListener("click", () => switchChat(conversation.id));
    els.chatList.append(button);

    const option = document.createElement("option");
    option.value = conversation.id;
    option.textContent = conversation.name || "Chat";
    option.selected = conversation.id === state.activeChatId;
    els.mobileChatSwitch.append(option);
  }
  renderReconnectButton();
}

function visibleConversations() {
  return Object.values(state.conversations)
    .filter((conversation) => !isEmptyDraftConversation(conversation.id))
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

function isEmptyDraftConversation(id) {
  const conversation = state.conversations[id];
  return Boolean(conversation) &&
    (id === "default" || conversation.name === "Neuer Chat" || conversation.name === "Aktueller Chat") &&
    !conversation.peerIdentityKey &&
    !conversation.signalingRoomId &&
    !state.messages.some((message) => message.chatId === id);
}

function cleanupAbandonedDraftChat() {
  const id = state.pendingDraftChatId;
  if (!id || state.sessionKey || !isEmptyDraftConversation(id)) {
    state.pendingDraftChatId = "";
    return;
  }
  delete state.conversations[id];
  if (state.activeChatId === id) {
    state.activeChatId = visibleConversations()[0]?.id || "default";
    ensureConversation(state.activeChatId, "Aktueller Chat");
  }
  state.pendingDraftChatId = "";
  persistConversations();
  renderChatList();
  renderMessages();
  renderSecurity();
}

function renderReconnectButton() {
  const conversation = state.conversations[state.activeChatId];
  const hidden = !conversation?.signalingRoomId || Boolean(state.sessionKey);
  els.reconnectChat.hidden = hidden;
  els.mobileReconnectChat.hidden = hidden;
}

function loadSeenMessageIds() {
  try {
    return JSON.parse(localStorage.getItem("seenMessageIds") || "[]");
  } catch {
    return [];
  }
}

function persistSeenMessageIds() {
  localStorage.setItem("seenMessageIds", JSON.stringify([...state.seen].slice(-1000)));
}

async function flushPendingOutbox() {
  if (!canSendUserData() || state.flushingOutbox) return;
  const pendingMessages = state.messages.filter(
    (message) =>
      message.chatId === state.activeChatId &&
      message.direction === "out" &&
      ["pending", "failed"].includes(message.status) &&
      !state.pending.has(message.id) &&
      !message.download &&
      !message.deleted,
  );
  if (pendingMessages.length === 0) return;

  state.flushingOutbox = true;
  try {
    for (const message of pendingMessages) {
      markMessage(message.id, "pending");
      await sendSecure(
        { kind: "chat", id: message.id, body: message.body, createdAt: message.createdAt },
        { messageId: message.id },
      );
    }
  } finally {
    state.flushingOutbox = false;
  }
}

function setConnection(kind, label, detail) {
  els.connectionDot.className = `dot ${kind}`;
  els.connectionLabel.textContent = label;
  els.connectionDetail.textContent = detail;
}

function countCandidates(description) {
  return (description?.sdp?.match(/^a=candidate:/gm) || []).length;
}

function describeCandidateStats() {
  const types = [...state.diag.candidateTypes].join(", ") || "noch keine";
  return `${state.diag.localCandidates} lokal, ${state.diag.remoteCandidates} remote, Typen: ${types}`;
}

function buildConnectionFailureText() {
  const stats = describeCandidateStats();
  if (state.diag.localCandidates === 0) {
    return `Keine lokalen WebRTC-Kandidaten gefunden (${stats}). Prüfe HTTPS, Browser-WebRTC und ob UDP/WebRTC blockiert ist.`;
  }
  if (state.diag.remoteCandidates === 0) {
    return `Der Code der anderen Seite enthält keine WebRTC-Kandidaten (${stats}). Beide Geräte neu laden und frische Codes erzeugen.`;
  }
  return `WebRTC kam nicht zustande (${stats}, ICE: ${state.diag.lastIceState}, Peer: ${state.diag.lastPeerState}). Prüfe Gast-WLAN/AP-Isolation, Firewall, VPN/iCloud Private Relay und ob UDP/WebRTC erlaubt ist.`;
}

function setCheck(el, ok, okText, pendingText) {
  el.textContent = ok ? okText : pendingText;
  el.className = ok ? "ok" : "warn";
}

function statusText(status) {
  if (status === "delivered") return "zugestellt";
  if (status === "failed") return "nicht bestätigt";
  return "ausstehend";
}

function needsSenderSignature(payload) {
  return ["chat", "message-edit", "message-delete", "file-meta", "file-end"].includes(payload.kind);
}

async function signPayloadIfNeeded(payload) {
  if (!needsSenderSignature(payload)) return payload;
  const signed = {
    ...payload,
    senderIdentityKey: state.localIdentityKey,
    senderName: els.displayName.value.trim() || defaultName(),
  };
  signed.signature = b64(
    await crypto.subtle.sign(
      { name: "ECDSA", hash: "SHA-256" },
      state.identity.privateKey,
      utf8(canonical(unsignedSignedPayload(signed))),
    ),
  );
  return signed;
}

async function verifyPayloadSignatureIfNeeded(payload) {
  if (!needsSenderSignature(payload)) return true;
  if (!payload.senderIdentityKey || !payload.signature || payload.senderIdentityKey !== state.remoteHello?.identityKey) {
    return false;
  }
  const publicKey = await crypto.subtle.importKey(
    "spki",
    fromB64(payload.senderIdentityKey),
    { name: "ECDSA", namedCurve: "P-256" },
    true,
    ["verify"],
  );
  return crypto.subtle.verify(
    { name: "ECDSA", hash: "SHA-256" },
    publicKey,
    fromB64(payload.signature),
    utf8(canonical(unsignedSignedPayload(payload))),
  );
}

function unsignedSignedPayload(payload) {
  const { signature, ...unsigned } = payload;
  return unsigned;
}

function publicHello(hello) {
  const { privateEph, ...rest } = hello;
  return rest;
}

function unsignedHello(hello) {
  return {
    version: hello.version,
    kind: hello.kind,
    name: hello.name,
    identityKey: hello.identityKey,
    ephKey: hello.ephKey,
    nonce: hello.nonce,
  };
}

function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

async function loadOrCreateIdentity() {
  const saved = await dbGet("identity");
  if (saved) return saved;
  const keyPair = await crypto.subtle.generateKey(
    { name: "ECDSA", namedCurve: "P-256" },
    true,
    ["sign", "verify"],
  );
  const identity = {
    privateKey: keyPair.privateKey,
    publicKey: keyPair.publicKey,
    publicKeySpki: await crypto.subtle.exportKey("spki", keyPair.publicKey),
  };
  await dbSet("identity", identity);
  return identity;
}

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function dbGet(key) {
  return new Promise((resolve, reject) => {
    const tx = state.db.transaction(STORE, "readonly");
    const request = tx.objectStore(STORE).get(key);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function dbSet(key, value) {
  return new Promise((resolve, reject) => {
    const tx = state.db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function fingerprint(buffer) {
  return new Uint8Array(await sha256(buffer));
}

function formatFingerprint(bytes) {
  return [...bytes.slice(0, 16)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
    .match(/.{1,4}/g)
    .join(" ");
}

function digitsFromBytes(bytes) {
  const value = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(0);
  return String(value % 1000000).padStart(6, "0").replace(/(\d{3})(\d{3})/, "$1 $2");
}

function randomBytes(length) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes;
}

function concatBytes(...parts) {
  const length = parts.reduce((sum, part) => sum + part.byteLength, 0);
  const output = new Uint8Array(length);
  let offset = 0;
  for (const part of parts) {
    output.set(new Uint8Array(part), offset);
    offset += part.byteLength;
  }
  return output;
}

async function sha256(data) {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", data));
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function utf8(value) {
  return encoder.encode(value);
}

function b64(value) {
  const bytes = new Uint8Array(value);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function fromB64(value) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function b64url(value) {
  return b64(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromB64url(value) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  return fromB64(padded);
}

async function packSignal(signal) {
  const raw = utf8(JSON.stringify(signal));
  if (!window.pako) {
    await loadScript("./src/vendor/pako.min.js?v=3");
  }
  if (!window.pako) return `j.${b64url(raw)}`;
  return `p.${b64url(window.pako.deflate(raw))}`;
}

async function unpackSignal(value) {
  if (value.startsWith("p.")) {
    if (!window.pako) {
      await loadScript("./src/vendor/pako.min.js?v=3");
    }
    if (!window.pako) throw new Error("pako missing");
    const bytes = fromB64url(value.slice(2));
    const decompressed = window.pako.inflate(bytes);
    return JSON.parse(decoder.decode(decompressed));
  }
  if (value.startsWith("z.")) {
    const bytes = fromB64url(value.slice(2));
    if (window.pako) {
      return JSON.parse(decoder.decode(window.pako.inflate(bytes)));
    }
    const decompressed = await streamToBytes(new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip")));
    return JSON.parse(decoder.decode(decompressed));
  }
  if (value.startsWith("j.")) {
    return JSON.parse(decoder.decode(fromB64url(value.slice(2))));
  }
  return JSON.parse(decoder.decode(fromB64url(value)));
}

function loadScript(src) {
  return new Promise((resolve) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      existing.addEventListener("load", resolve, { once: true });
      existing.addEventListener("error", resolve, { once: true });
      window.setTimeout(resolve, 500);
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.onload = resolve;
    script.onerror = resolve;
    document.head.append(script);
  });
}

async function streamToBytes(stream) {
  const reader = stream.getReader();
  const chunks = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    total += value.byteLength;
  }
  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return out;
}

function defaultName() {
  return `Browser ${formatFingerprint(crypto.getRandomValues(new Uint8Array(4))).slice(0, 9)}`;
}
