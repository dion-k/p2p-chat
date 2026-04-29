# LAN Secure Chat

Static browser-first encrypted peer-to-peer chat over WebRTC DataChannels.

## Run locally

Local-only HTTP:

```bash
python3 -m http.server 4173 --bind 127.0.0.1
```

LAN HTTPS:

```bash
python3 serve_https.py
```

Open `https://10.93.10.69:4443` from another device on the same LAN.

For another device in the LAN, the app should be served from HTTPS or another browser-secure origin. `localhost` is secure for local testing, but plain `http://192.168.x.x` is not a secure context in normal browsers and can disable Web Crypto. The included dev certificate is self-signed and valid for `10.93.10.69`, `127.0.0.1`, and `localhost`.

## Static hosting

The app is static client-side code and can be hosted on GitHub Pages, Cloudflare Pages, Netlify, or any HTTPS static host. Upload the repository root as the site directory.

Required static files:

- `index.html`
- `styles.css`
- `manifest.webmanifest`
- `sw.js`
- `icons/icon.svg`
- `src/main.js`
- `src/vendor/*`

No chat messages are sent to the static host. The host only serves the app files. WebRTC signaling can be manual or use an optional WebSocket signaling server. Pending text messages are kept locally and retried after the next verified reconnect.

## Optional Cloudflare signaling

The app can use Cloudflare only for discovery/signaling. It does not send plaintext chat messages, file contents, session keys, identity private keys, or SAS confirmation secrets to Cloudflare.

Architecture:

- Static app remains hostable anywhere.
- The client stores a configurable WebSocket signaling URL, so a Cloudflare Worker can later be replaced by a self-hosted server with the same room protocol.
- One short-lived Durable Object is used per room code.
- The Durable Object keeps only connected WebSockets plus transient WebRTC offer/answer forwarding in memory.
- KV is not used.
- Room expiry is handled with one Durable Object alarm after inactivity.
- Invite links contain the room ID and signaling server URL, not E2E secrets.
- WebSocket is the primary transport; HTTP polling can be added later without changing the E2E chat format.

Cloudflare limits and resource notes:

- Durable Objects are appropriate here because each room is an independent coordination atom.
- A single Durable Object is single-threaded; this app keeps rooms small and short-lived.
- Cloudflare documents a soft per-object throughput around 1,000 simple requests per second and a 32 MiB received WebSocket message limit. The included Worker rejects signaling frames over 256 KiB.
- SQLite-backed Durable Objects are available on Free/Paid Workers plans; Free accounts have account-level Durable Object storage limits. This implementation stores only short-lived WebRTC signaling frames per active room and deletes them when the room expires.
- WebSocket hibernation is used through the Durable Object WebSocket API so idle connected rooms can avoid continuous duration charges.
- The signaling protocol uses join acknowledgements, active-peer notifications, short-lived signal replay, and Trickle ICE candidates. No chat plaintext or E2E session keys are sent to the Worker.

The optional Worker lives in `cloudflare-signaling/`. Deploy it separately and paste the resulting `wss://...workers.dev` URL into the app's Signaling-Server field.

### Signaling-Server eintragen

1. App öffnen.
2. Auf Desktop links `Signaling-Server` öffnen. Auf Mobile `Einstellungen` öffnen und dann `Signaling-Server`.
3. Standardmaessig ist `https://signaling.p2p.di0n.de` eingetragen. Du kannst stattdessen eine eigene Worker-URL eintragen, zum Beispiel `https://lan-secure-chat-signaling.<account>.workers.dev` oder direkt `wss://lan-secure-chat-signaling.<account>.workers.dev`.
4. `Verbinden` öffnen und eine Einladung starten. Der Invite-Link enthält nur Raum-ID und Server-URL, keine Chatnachrichten oder Schlüssel.

### Cloudflare Signaling deployen

Voraussetzung: Node.js und ein Cloudflare-Account.

```bash
cd cloudflare-signaling
npm install
npx wrangler login
npm run deploy
```

Wrangler verwendet `wrangler.jsonc`. Darin ist ein Durable Object Binding `SIGNALING_ROOM` mit der Klasse `SignalingRoom` und eine `new_sqlite_classes`-Migration `v1` definiert. Cloudflare empfiehlt `wrangler.jsonc` fuer neue Projekte, und Durable-Object-Migrationen werden beim `wrangler deploy` angewendet. Nach dem Deploy zeigt Wrangler die Worker-URL an; diese URL in der App als Signaling-Server eintragen.

Lokaler Test des Signaling Workers:

```bash
cd cloudflare-signaling
npm run dev
```

Danach in der App `ws://127.0.0.1:8787` als Signaling-Server eintragen.

## Pairing flow

Use `Verbinden` on both devices.

1. On first start, choose a device name.
2. If a signaling server is configured, one device starts an invitation and shares the short code, link, or QR code.
3. Other devices enter the code/link or scan the QR code.
4. Both devices wait until the encrypted channel is ready.
5. Both devices compare the six-digit security code out-of-band.
6. Both click `Code stimmt überein`.

Manual long offer/answer codes remain available under `Erweitert` for offline or no-server use.

Only then are text messages and file transfers enabled.

## Security model

- WebRTC DataChannel is used only as the transport.
- ICE now uses public STUN servers to improve browser-to-browser connectivity when mDNS host candidates are not enough. STUN does not carry chat messages, but it does contact third-party infrastructure for connectivity discovery.
- Each browser profile creates a persistent ECDSA P-256 identity key in IndexedDB.
- Every session creates a fresh ephemeral ECDH P-256 key.
- The ephemeral key is signed by the persistent identity key.
- User chat payloads and file transfer control payloads are signed with the persistent identity key before they are encrypted for the peer session.
- Both peers derive a session key with HKDF-SHA-256.
- Messages and file chunks are encrypted with AES-GCM.
- AES-GCM additional authenticated data includes the secure frame header.
- The six-digit SAS code is derived from the signed handshake transcript and ECDH secret.
- User messages are blocked until both sides confirm the SAS code.
- App-level ACKs and retries detect unconfirmed delivery.
- Pending outgoing text messages and received message IDs persist locally, so reconnecting with fresh codes can retry unacknowledged messages without duplicating already-seen message IDs.
- Sent text messages can be edited or deleted for everyone while a verified peer session is active. Messages and whole chats can also be deleted locally from this browser only.
- Each reconnect derives a fresh session key. The long-term identity key persists per browser profile and identifies the device; the per-chat session key does not persist and is replaced every time the devices reconnect.
- QR codes are generated locally in the browser with the vendored MIT-licensed `qrcode-generator` library.
- QR scanning uses `BarcodeDetector` when available and falls back to the vendored `jsQR` decoder for mobile browsers.
- Signaling codes are compressed in modern browsers to make QR codes easier to scan.
- The app includes a web manifest and service worker so supporting browsers can install it as a standalone web app.

## Current limits

- No automatic LAN discovery.
- No server relay or offline store-and-forward yet.
- Some networks still block direct WebRTC despite valid codes, especially guest Wi-Fi, AP/client isolation, VPNs, iCloud Private Relay, and networks blocking UDP/STUN.
- Manual copy/paste signaling is still available as fallback.
- Multiple chat histories are persisted. The active WebRTC engine is prepared as `sessions: Map<chatId, Session>`, but full concurrent multi-peer sessions are still the next architecture step.
- V1 group chat is prepared for pairwise encrypted peer sessions. True concurrent group fan-out and MLS/Sender-Key style group encryption are not complete yet.
- Message history is stored locally in browser storage for V1.
- Strict networks may block WebRTC. A later HTTPS/WebSocket relay mode should be added for those environments while keeping the same E2E payload encryption.
