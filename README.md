# P2P Chat

P2P Chat ist eine browserbasierte Ende-zu-Ende-verschlüsselte Chat-App für direkte WebRTC-Verbindungen. Die öffentliche Instanz ist bereits unter [p2p.di0n.de](https://p2p.di0n.de) verfügbar und kann dort ohne eigene Installation genutzt werden. Es gibt keine App-seitigen Nutzungslimits; nur der optionale Signaling-Server hat technische und kontoabhängige Ressourcenlimits.

## Was die App macht

- Direkte Peer-to-Peer-Chats über WebRTC DataChannels
- Ende-zu-Ende-Verschlüsselung im Browser
- Optionales Cloudflare-WebSocket-Signaling für einfachere Einladungen und Reconnect
- Kurze Invite-Links und QR-Codes
- Lokale Chat-Historie im Browser
- Reconnect für bekannte Chats
- Ausstehende Textnachrichten werden nach einem verifizierten Reconnect erneut gesendet
- Mehrere Chat-Verläufe
- V2-Gruppenchats als paarweise verschlüsseltes Mesh
- Dateiübertragung mit verschlüsselten Metadaten, Chunks, Fortschritt und Vorschau
- Nachrichten bearbeiten oder für alle löschen
- Nachrichten oder ganze Chats nur lokal aus dem eigenen Browser löschen
- Vollständiger lokaler Reset aller App-Daten

## Sicherheitsmodell

Der Server ist nur Komfort-Infrastruktur für Discovery und WebRTC-Signaling. Er soll als potenziell nicht vertraünswürdig betrachtet werden.

Der Server sieht:

- Raum-ID
- verbundene Signaling-Clients
- kurzlebige WebRTC-Signaling-Daten
- technische Verbindungsmetadaten

Der Server sieht nicht:

- Klartextnachrichten
- Dateiinhalte
- Dateimetadaten im Klartext
- private Identity Keys
- WebRTC Session Keys
- SAS-Verifizierungscodes als Geheimnis

Jeder Browser erzeugt einen persistenten Identity Signing Key. Jede Verbindung erzeugt frische Session Keys. Nachrichten-Payloads werden senderseitig signiert und anschliessend für die jeweilige Peer-Session verschlüsselt. Bei Gruppenchats sendet die App V2-Nachrichten paarweise an alle verifizierten Peer-Sessions.

## Gruppenchats

Ein Gruppenchat entsteht, indem derselbe Invite-Link oder QR-Code mit mehreren Geräten geteilt wird. Jedes beitretende Gerät baut eine eigene WebRTC-Session zu den anderen Teilnehmern auf. Die App zeigt pro verbundenem Gerät einen Sicherheitscode an. Nachrichten und Dateien werden danach an die verifizierten Peer-Sessions verteilt.

Das aktuelle Gruppenmodell ist bewusst einfach und robust:

- kein Klartext über den Server
- keine Gruppenschlüssel auf dem Server
- pro Peer eigene Verschlüsselung
- senderseitig signierte Chat-Payloads

Ein späteres V3 kann echte Gruppen-Schlüssel, Sender Keys oder MLS-ähnliche Mechaniken ergänzen.

## Signaling

Standardmäßig nutzt die App den Signaling-Server:

```text
https://signaling.p2p.di0n.de
```

Der Signaling-Server ist optional. Er macht Verbindungsaufbau, Invite-Links und Reconnect einfacher. Ohne Signaling bleibt die App weiterhin als statische Web-App nutzbar, dann muss der manuelle Code-Fluss verwendet werden.

Die mitgelieferte Cloudflare-Worker-Komponente liegt in `cloudflare-signaling/`. Sie nutzt ein Durable Object pro kurzlebigem Raum und kein KV. Pro Raum wird nur minimaler Zustand gehalten:

- Raum-ID
- aktive WebSocket-Clients
- kurzlebige WebRTC-Signaling-Nachrichten
- Inaktivitätsablauf per Durable-Object-Alarm

## Hosting

Die App ist bereits auf [p2p.di0n.de](https://p2p.di0n.de) gehostet. Wer trotzdem eine eigene Instanz hosten möchte, braucht nur die statischen Dateien aus `public/`.

Geeignete Hosts sind zum Beispiel:

- GitHub Pages
- Cloudflare Pages
- Cloudflare Workers Static Assets
- Netlify
- klassische Webspaces mit HTTPS

Wichtig: Nicht den kompletten Repository-Root als Webroot veröffentlichen. öffentlich benötigt wird nur `public/`.

Für Cloudflare Workers Static Assets liegt im Repository-Root eine `wrangler.jsonc`, die nur `./public` deployed und kurze Invite-Routen über `assets.not_found_handling = "single-page-application"` auf die App routet.

## Projektstruktur

```text
public/
  index.html
  styles.css
  sw.js
  manifest.webmanifest
  icons/
  src/
    main.js
    vendor/

cloudflare-signaling/
  worker.js
  wrangler.jsonc
```

## Datenschutz

Chats, bekannte Geräte, Pending-Outbox, gesehene Nachrichten-IDs und Identity Keys werden lokal im Browser gespeichert. Mit dem Button "App-Daten löschen" kann der lokale Zustand inklusive gespeicherter Chats, Gerätename, Service-Worker-Cache, Browser-Speicher und Verschlüsselungs-Keys gelöscht werden.

## Roadmap

- Feineres Trust-UI für Gruppenmitglieder
- Bessere per-Empfänger-Zustellbestätigungen in Gruppenchats
- Optionaler HTTP-Polling-Fallback für Signaling
- Optionaler Relay-Modus für sehr restriktive Netzwerke, weiterhin mit E2E-Payloads
- Wiki-Seiten für Setup, Sicherheit, Signaling und Troubleshooting
- GitHub Releases, sobald die App als stabiler Release-Kandidat markiert wird

## Lizenz und Vendor-Dateien

Die App nutzt vendored Browser-Bibliotheken für QR-Codes, QR-Scanning und Kompression. Details stehen in den jeweiligen Dateien unter `public/src/vendor/`.
