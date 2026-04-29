const PROTOCOL = "lan-secure-chat-signal-v1";
const ROOM_TTL_MS = 30 * 60 * 1000;
const SIGNAL_TTL_MS = 2 * 60 * 1000;
const MAX_SIGNAL_BYTES = 256 * 1024;
const MAX_STORED_SIGNALS = 64;
const MAX_CLIENTS_PER_ROOM = 8;
const SIGNALS_KEY = "signals";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/health") {
      return Response.json({ ok: true, service: "lan-secure-chat-signaling" });
    }

    const match = url.pathname.match(/^\/room\/([A-Z0-9]{6,32})$/i);
    if (!match) {
      return new Response("Not found", { status: 404 });
    }

    if (request.method !== "GET") {
      return new Response("Method not allowed", { status: 405 });
    }

    if (request.headers.get("Upgrade")?.toLowerCase() !== "websocket") {
      return new Response("WebSocket required", { status: 426 });
    }

    const roomId = match[1].toUpperCase();
    const stub = env.SIGNALING_ROOM.getByName(roomId);
    return stub.fetch(request);
  },
};

export class SignalingRoom {
  constructor(ctx, env) {
    this.ctx = ctx;
    this.env = env;
  }

  async fetch(request) {
    const sockets = this.activeSockets();
    if (sockets.length >= MAX_CLIENTS_PER_ROOM) {
      return new Response("Room full", { status: 429 });
    }

    const url = new URL(request.url);
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    const clientId = cleanId(url.searchParams.get("client")) || crypto.randomUUID();

    server.serializeAttachment({
      clientId,
      name: "",
      joined: false,
      joinedAt: Date.now(),
      seenAt: Date.now(),
    });
    this.ctx.acceptWebSocket(server);
    await this.bumpExpiry();

    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws, message) {
    if (message === "pong") return;
    if (typeof message !== "string" || byteLength(message) > MAX_SIGNAL_BYTES) {
      ws.close(1009, "signal too large");
      return;
    }

    let payload;
    try {
      payload = JSON.parse(message);
    } catch {
      ws.close(1003, "invalid json");
      return;
    }

    if (payload.protocol !== PROTOCOL || payload.type === "chat") {
      ws.close(1008, "unsupported message");
      return;
    }

    const attachment = this.updateAttachment(ws, payload);

    if (payload.type === "join") {
      await this.handleJoin(ws, attachment, payload);
      return;
    }

    if (payload.type === "signal" && ["offer", "answer", "candidate"].includes(payload.kind)) {
      await this.handleSignal(ws, attachment, payload);
      return;
    }

    this.sendJson(ws, {
      type: "error",
      protocol: PROTOCOL,
      code: "unsupported_type",
      message: "Unsupported signaling message.",
    });
  }

  async handleJoin(ws, attachment, payload) {
    const updated = {
      ...attachment,
      name: cleanName(payload.name),
      role: payload.role === "offerer" ? "offerer" : "answerer",
      joined: true,
      seenAt: Date.now(),
    };
    ws.serializeAttachment(updated);

    const peers = this.activeSockets()
      .filter((socket) => socket !== ws)
      .map((socket) => socket.deserializeAttachment())
      .filter((peer) => peer?.joined)
      .map(publicPeer);

    this.sendJson(ws, {
      type: "room-ready",
      protocol: PROTOCOL,
      clientId: updated.clientId,
      peers,
      serverTime: Date.now(),
    });

    this.broadcast(ws, {
      type: "peer-joined",
      protocol: PROTOCOL,
      clientId: updated.clientId,
      name: updated.name,
      role: updated.role,
      serverTime: Date.now(),
    });

    await this.replaySignals(ws, updated.clientId);
    await this.bumpExpiry();
  }

  async handleSignal(ws, attachment, payload) {
    if (!attachment.joined) {
      this.sendJson(ws, {
        type: "error",
        protocol: PROTOCOL,
        code: "join_required",
        message: "Join the room before sending signaling frames.",
      });
      return;
    }

    const outgoing = {
      id: cleanId(payload.id) || crypto.randomUUID(),
      type: "signal",
      protocol: PROTOCOL,
      clientId: attachment.clientId,
      name: attachment.name,
      kind: payload.kind,
      description: payload.description,
      candidate: payload.candidate,
      createdAt: Date.now(),
    };

    await this.storeSignal(outgoing);
    this.broadcast(ws, outgoing);
    this.sendJson(ws, {
      type: "signal-ack",
      protocol: PROTOCOL,
      id: outgoing.id,
      kind: outgoing.kind,
      serverTime: Date.now(),
    });
    await this.bumpExpiry();
  }

  async replaySignals(ws, clientId) {
    const activePeerIds = new Set(
      this.activeSockets()
        .filter((socket) => socket !== ws)
        .map((socket) => socket.deserializeAttachment())
        .filter((peer) => peer?.joined)
        .map((peer) => peer.clientId),
    );
    const signals = await this.readSignals();
    for (const signal of signals) {
      if (signal.clientId === clientId) continue;
      if (!activePeerIds.has(signal.clientId)) continue;
      this.sendJson(ws, { ...signal, replay: true });
    }
  }

  async storeSignal(signal) {
    const now = Date.now();
    const signals = (await this.readSignals())
      .filter((entry) => now - entry.createdAt <= SIGNAL_TTL_MS)
      .filter((entry) => entry.clientId !== signal.clientId || entry.kind !== signal.kind || entry.id !== signal.id);
    signals.push(signal);
    await this.ctx.storage.put(SIGNALS_KEY, signals.slice(-MAX_STORED_SIGNALS));
  }

  async readSignals() {
    return (await this.ctx.storage.get(SIGNALS_KEY)) || [];
  }

  async webSocketClose() {
    await this.bumpExpiry();
  }

  async webSocketError() {
    await this.bumpExpiry();
  }

  activeSockets() {
    return this.ctx.getWebSockets().filter((socket) => socket.readyState === WebSocket.OPEN);
  }

  updateAttachment(ws, payload) {
    const attachment = ws.deserializeAttachment() || {};
    const clientId = cleanId(payload.clientId || attachment.clientId) || crypto.randomUUID();
    const name = cleanName(payload.name || attachment.name);
    const updated = { ...attachment, clientId, name, seenAt: Date.now() };
    ws.serializeAttachment(updated);
    return updated;
  }

  broadcast(sender, payload) {
    for (const socket of this.activeSockets()) {
      if (socket === sender) continue;
      if (!socket.deserializeAttachment()?.joined) continue;
      this.sendJson(socket, payload);
    }
  }

  sendJson(ws, payload) {
    if (ws.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify(payload));
  }

  async bumpExpiry() {
    await this.ctx.storage.setAlarm(Date.now() + ROOM_TTL_MS);
  }

  async alarm() {
    for (const socket of this.activeSockets()) {
      socket.close(1001, "room expired");
    }
    await this.ctx.storage.delete(SIGNALS_KEY);
    await this.ctx.storage.deleteAlarm();
  }
}

function publicPeer(peer) {
  return {
    clientId: peer.clientId,
    name: peer.name,
    role: peer.role,
    joinedAt: peer.joinedAt,
  };
}

function cleanId(value) {
  return String(value || "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 80);
}

function cleanName(value) {
  return String(value || "").slice(0, 80);
}

function byteLength(value) {
  return new TextEncoder().encode(value).byteLength;
}
