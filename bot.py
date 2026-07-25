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
    enviar_telegram(f"🟢 *Rastreador Bot 2 Iniciado*\nMonitoreando número: `{NUMERO}`")
    
    # Usamos una API de presencia o validación de estado alternativa
    url_api = f"https://wa.me/s/{NUMERO}"
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
    ultimo_estado = None
    
    while True:
        try:
            res = requests.get(url_api, headers=headers, timeout=10, allow_redirects=True)
            # Verificamos cambios basados en la respuesta de la cabecera o redirección
            estado = "ONLINE" if res.status_code == 200 else "OFFLINE"
            
            if ultimo_estado is not None and estado != ultimo_estado:
                msg = f"⚡ *¡ONLINE!* El número `{NUMERO}` se ha conectado." if estado == "ONLINE" else f"💤 El número `{NUMERO}` se ha desconectado."
                enviar_telegram(msg)
            ultimo_estado = estado
        except Exception as e:
            pass
        time.sleep(20)

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
