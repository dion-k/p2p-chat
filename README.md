# P2P Chat

P2P Chat ist eine browserbasierte Ende-zu-Ende-verschluesselte Chat-App fuer direkte WebRTC-Verbindungen. Die oeffentliche Instanz ist bereits unter [p2p.di0n.de](https://p2p.di0n.de) verfuegbar und kann dort ohne eigene Installation genutzt werden. Es gibt keine App-seitigen Nutzungslimits; nur der optionale Signaling-Server hat technische und kontoabhaengige Ressourcenlimits.

## Was die App macht

- Direkte Peer-to-Peer-Chats ueber WebRTC DataChannels
- Ende-zu-Ende-Verschluesselung im Browser
- Optionales Cloudflare-WebSocket-Signaling fuer einfachere Einladungen und Reconnect
- Kurze Invite-Links und QR-Codes
- Lokale Chat-Historie im Browser
- Reconnect fuer bekannte Chats
- Ausstehende Textnachrichten werden nach einem verifizierten Reconnect erneut gesendet
- Mehrere Chat-Verlaeufe
- V2-Gruppenchats als paarweise verschluesseltes Mesh
- Dateiuebertragung mit verschluesselten Metadaten, Chunks, Fortschritt und Vorschau
- Nachrichten bearbeiten oder fuer alle loeschen
- Nachrichten oder ganze Chats nur lokal aus dem eigenen Browser loeschen
- Vollstaendiger lokaler Reset aller App-Daten

## Sicherheitsmodell

Der Server ist nur Komfort-Infrastruktur fuer Discovery und WebRTC-Signaling. Er soll als potenziell nicht vertrauenswuerdig betrachtet werden.

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

Jeder Browser erzeugt einen persistenten Identity Signing Key. Jede Verbindung erzeugt frische Session Keys. Nachrichten-Payloads werden senderseitig signiert und anschliessend fuer die jeweilige Peer-Session verschluesselt. Bei Gruppenchats sendet die App V2-Nachrichten paarweise an alle verifizierten Peer-Sessions.

## Gruppenchats

Ein Gruppenchat entsteht, indem derselbe Invite-Link oder QR-Code mit mehreren Geraeten geteilt wird. Jedes beitretende Geraet baut eine eigene WebRTC-Session zu den anderen Teilnehmern auf. Die App zeigt pro verbundenem Geraet einen Sicherheitscode an. Nachrichten und Dateien werden danach an die verifizierten Peer-Sessions verteilt.

Das aktuelle Gruppenmodell ist bewusst einfach und robust:

- kein Klartext ueber den Server
- keine Gruppenschluessel auf dem Server
- pro Peer eigene Verschluesselung
- senderseitig signierte Chat-Payloads

Ein spaeteres V3 kann echte Gruppen-Schluessel, Sender Keys oder MLS-aehnliche Mechaniken ergaenzen.

## Signaling

Standardmaessig nutzt die App den Signaling-Server:

```text
https://signaling.p2p.di0n.de
```

Der Signaling-Server ist optional. Er macht Verbindungsaufbau, Invite-Links und Reconnect einfacher. Ohne Signaling bleibt die App weiterhin als statische Web-App nutzbar, dann muss der manuelle Code-Fluss verwendet werden.

Die mitgelieferte Cloudflare-Worker-Komponente liegt in `cloudflare-signaling/`. Sie nutzt ein Durable Object pro kurzlebigem Raum und kein KV. Pro Raum wird nur minimaler Zustand gehalten:

- Raum-ID
- aktive WebSocket-Clients
- kurzlebige WebRTC-Signaling-Nachrichten
- Inaktivitaetsablauf per Durable-Object-Alarm

## Hosting

Die App ist bereits auf [p2p.di0n.de](https://p2p.di0n.de) gehostet. Wer trotzdem eine eigene Instanz hosten moechte, braucht nur die statischen Dateien aus `public/`.

Geeignete Hosts sind zum Beispiel:

- GitHub Pages
- Cloudflare Pages
- Cloudflare Workers Static Assets
- Netlify
- klassische Webspaces mit HTTPS

Wichtig: Nicht den kompletten Repository-Root als Webroot veroeffentlichen. Oeffentlich benoetigt wird nur `public/`.

Fuer Cloudflare Workers Static Assets liegt im Repository-Root eine `wrangler.jsonc`, die nur `./public` deployed und kurze Invite-Routen ueber `assets.not_found_handling = "single-page-application"` auf die App routet.

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

Chats, bekannte Geraete, Pending-Outbox, gesehene Nachrichten-IDs und Identity Keys werden lokal im Browser gespeichert. Mit dem Button "App-Daten loeschen" kann der lokale Zustand inklusive gespeicherter Chats, Geraetename, Service-Worker-Cache, Browser-Speicher und Verschluesselungs-Keys geloescht werden.

## Roadmap

- Feineres Trust-UI fuer Gruppenmitglieder
- Bessere per-Empfaenger-Zustellbestaetigungen in Gruppenchats
- Optionaler HTTP-Polling-Fallback fuer Signaling
- Optionaler Relay-Modus fuer sehr restriktive Netzwerke, weiterhin mit E2E-Payloads
- Wiki-Seiten fuer Setup, Sicherheit, Signaling und Troubleshooting
- GitHub Releases, sobald die App als stabiler Release-Kandidat markiert wird

## Lizenz und Vendor-Dateien

Die App nutzt vendored Browser-Bibliotheken fuer QR-Codes, QR-Scanning und Kompression. Details stehen in den jeweiligen Dateien unter `public/src/vendor/`.
