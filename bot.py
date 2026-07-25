import os
import time
import requests
from http.server import BaseHTTPRequestHandler, HTTPServer
import threading

NUMERO = "593996752239"
TELEGRAM_TOKEN = "8959408870:AAGmrKCpVK8HxbACmGIVhQjR1-yGubmh2s0"
TELEGRAM_ID = "7410396096"

def enviar_telegram(mensaje):
    url = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendMessage"
    try:
        requests.post(url, json={"chat_id": TELEGRAM_ID, "text": mensaje, "parse_mode": "Markdown"})
    except:
        pass

def rastrear():
    # Mensaje de prueba inicial para confirmar que Telegram recibe
    enviar_telegram(f"🟢 *Rastreador Bot 2 Iniciado*\nMonitoreando número: `{NUMERO}`")
    
    url_api = f"https://wa.me/{NUMERO}"
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
    ultimo_estado = None
    
    while True:
        try:
            res = requests.get(url_api, headers=headers, timeout=15)
            estado = "ONLINE" if res.status_code == 200 and ("chat" in res.text.lower() or "whatsapp" in res.text.lower()) else "OFFLINE"
            
            if ultimo_estado is not None and estado != ultimo_estado:
                msg = f"📱 *Rastreador Bot 2*\nEl número `{NUMERO}` ahora está: *{estado}*"
                enviar_telegram(msg)
            ultimo_estado = estado
        except Exception as e:
            pass
        time.sleep(30)

class SimpleHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.end_headers()
        self.wfile.write(b"Bot 2 Activo y Monitoreando")

def run_server():
    port = int(os.environ.get("PORT", 10000))
    server = HTTPServer(('0.0.0.0', port), SimpleHandler)
    server.serve_forever()

t = threading.Thread(target=rastrear, daemon=True)
t.start()
run_server()
