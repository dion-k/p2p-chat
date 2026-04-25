# LAN Secure Chat

Static browser-only V1 for encrypted peer-to-peer chat over WebRTC DataChannels.

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

No chat messages are sent to the static host. The host only serves the app files. WebRTC signaling is still manual in V1, so if both browsers are closed, users must reconnect with fresh QR/copy codes. Pending text messages are kept locally and retried after the next verified reconnect.

## Pairing flow

Use `Verbindungsassistent` on both devices.

1. Device A chooses `Ich bin Gerät A` and shows the invitation QR code.
2. Device B chooses `Ich bin Gerät B`, scans or pastes the invitation, and shows its answer QR code.
3. Device A scans or pastes the answer code.
4. Both devices wait until the encrypted channel is ready.
5. Both devices compare the six-digit security code out-of-band.
6. Both click `Code stimmt überein`.

Only then are text messages and file transfers enabled.

## Security model

- WebRTC DataChannel is used only as the transport.
- ICE now uses public STUN servers to improve browser-to-browser connectivity when mDNS host candidates are not enough. STUN does not carry chat messages, but it does contact third-party infrastructure for connectivity discovery.
- Each browser profile creates a persistent ECDSA P-256 identity key in IndexedDB.
- Every session creates a fresh ephemeral ECDH P-256 key.
- The ephemeral key is signed by the persistent identity key.
- Both peers derive a session key with HKDF-SHA-256.
- Messages and file chunks are encrypted with AES-GCM.
- AES-GCM additional authenticated data includes the secure frame header.
- The six-digit SAS code is derived from the signed handshake transcript and ECDH secret.
- User messages are blocked until both sides confirm the SAS code.
- App-level ACKs and retries detect unconfirmed delivery.
- Pending outgoing text messages and received message IDs persist locally, so reconnecting with fresh codes can retry unacknowledged messages without duplicating already-seen message IDs.
- Each reconnect derives a fresh session key. The long-term identity key persists per browser profile and identifies the device; the per-chat session key does not persist and is replaced every time the devices reconnect.
- QR codes are generated locally in the browser with the vendored MIT-licensed `qrcode-generator` library.
- QR scanning uses `BarcodeDetector` when available and falls back to the vendored `jsQR` decoder for mobile browsers.
- Signaling codes are compressed in modern browsers to make QR codes easier to scan.
- The app includes a web manifest and service worker so supporting browsers can install it as a standalone web app.

## Current limits

- No automatic LAN discovery.
- No server relay or offline store-and-forward yet.
- Some networks still block direct WebRTC despite valid codes, especially guest Wi-Fi, AP/client isolation, VPNs, iCloud Private Relay, and networks blocking UDP/STUN.
- Manual copy/paste signaling is required.
- The UI has a prepared chat list, but the current protocol still supports one active peer session. Multiple parallel chats are the next architecture step.
- Message history is stored locally in browser storage for V1.
- Strict networks may block WebRTC. A later HTTPS/WebSocket relay mode should be added for those environments while keeping the same E2E payload encryption.
