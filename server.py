import http.server
import socketserver
import json
import os
from datetime import datetime

PORT = int(os.environ.get("PORT", 3000))

class HealthAndStaticRequestHandler(http.server.SimpleHTTPRequestHandler):
    def do_HEAD(self):
        if self.path in ['/ping', '/health', '/']:
            self.send_response(200)
            self.send_header('Content-type', 'text/plain; charset=utf-8')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            return
        return super().do_HEAD()

    def do_GET(self):
        if self.path == '/ping':
            self.send_response(200)
            self.send_header('Content-type', 'text/plain; charset=utf-8')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(b'OK')
            return

        if self.path == '/health':
            self.send_response(200)
            self.send_header('Content-type', 'application/json; charset=utf-8')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            payload = {
                "status": "UP",
                "timestamp": datetime.utcnow().isoformat() + "Z"
            }
            self.wfile.write(json.dumps(payload).encode('utf-8'))
            return

        if self.path == '/api/sync-2026-2027':
            self.send_response(200)
            self.send_header('Content-type', 'application/json; charset=utf-8')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            try:
                import update_2026_2027_data
                update_2026_2027_data.run_sync()
                res = {"status": "SUCCESS", "message": "2026-2027 sezonu verileri football-data.co.uk adresi üzerinden başarıyla güncellendi!"}
            except Exception as e:
                res = {"status": "ERROR", "message": str(e)}
            self.wfile.write(json.dumps(res, ensure_ascii=False).encode('utf-8'))
            return

        # Fallback to default static file serving
        return super().do_GET()

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS')
        self.end_headers()

if __name__ == '__main__':
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), HealthAndStaticRequestHandler) as httpd:
        print(f"[AnalizBot] Sunucu {PORT} portunda aktif!")
        print(f"Erisim adresi: http://localhost:{PORT}")
        print(f"UptimeRobot ping adresi: http://localhost:{PORT}/ping")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nSunucu durduruldu.")
