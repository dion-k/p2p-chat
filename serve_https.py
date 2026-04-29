from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
import ssl


HOST = "0.0.0.0"
PORT = 4443
CERT = "devcert/lan-secure-chat.crt"
KEY = "devcert/lan-secure-chat.key"


class Handler(SimpleHTTPRequestHandler):
    extensions_map = {
        **SimpleHTTPRequestHandler.extensions_map,
        ".js": "application/javascript",
        ".css": "text/css",
        ".html": "text/html",
    }


httpd = ThreadingHTTPServer((HOST, PORT), Handler)
context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
context.load_cert_chain(certfile=CERT, keyfile=KEY)
httpd.socket = context.wrap_socket(httpd.socket, server_side=True)

print(f"Serving HTTPS on https://{HOST}:{PORT}")
httpd.serve_forever()
