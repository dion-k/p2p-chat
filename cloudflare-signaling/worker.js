const PROTOCOL = "lan-secure-chat-signal-v1";
const ROOM_TTL_MS = 30 * 60 * 1000;
const MAX_SIGNAL_BYTES = 256 * 1024;

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

    if (request.headers.get("Upgrade") !== "websocket") {
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
    const url = new URL(request.url);
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    const clientId = url.searchParams.get("client") || crypto.randomUUID();

    server.serializeAttachment({
      clientId,
      name: "",
      joinedAt: Date.now(),
    });
    this.ctx.acceptWebSocket(server);
    await this.bumpExpiry();

    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws, message) {
    if (typeof message !== "string" || message.length > MAX_SIGNAL_BYTES) {
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

    const attachment = ws.deserializeAttachment() || {};
    const clientId = String(payload.clientId || attachment.clientId || crypto.randomUUID());
    const name = String(payload.name || attachment.name || "").slice(0, 80);
    ws.serializeAttachment({ ...attachment, clientId, name, seenAt: Date.now() });

    if (payload.type === "join") {
      this.broadcast(ws, {
        type: "peer-joined",
        protocol: PROTOCOL,
        clientId,
        name,
      });
      await this.bumpExpiry();
      return;
    }

    if (payload.type === "signal" && ["offer", "answer", "candidate"].includes(payload.kind)) {
      this.broadcast(ws, {
        type: "signal",
        protocol: PROTOCOL,
        clientId,
        kind: payload.kind,
        description: payload.description,
        candidate: payload.candidate,
      });
      await this.bumpExpiry();
    }
  }

  async webSocketClose() {
    await this.bumpExpiry();
  }

  async webSocketError() {
    await this.bumpExpiry();
  }

  broadcast(sender, payload) {
    for (const socket of this.ctx.getWebSockets()) {
      if (socket === sender || socket.readyState !== WebSocket.OPEN) continue;
      socket.send(JSON.stringify(payload));
    }
  }

  async bumpExpiry() {
    await this.ctx.storage.setAlarm(Date.now() + ROOM_TTL_MS);
  }

  async alarm() {
    for (const socket of this.ctx.getWebSockets()) {
      socket.close(1001, "room expired");
    }
    await this.ctx.storage.deleteAlarm();
  }
}
