const { makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const pino = require('pino');
const express = require('express');
const axios = require('axios');
const qrcode = require('qrcode');

const app = express();
const PORT = process.env.PORT || 10000;

const TELEGRAM_TOKEN = "8959408870:AAGmrKCpVK8HxbACmGIVhQjR1-yGubmh2s0";
const TELEGRAM_ID = "7410396096";
const NUMERO_OBJETIVO = "593996752239@s.whatsapp.net";

let qrCodeUltimo = "";
let estadoConexion = "Desconectado";

async function enviarTelegram(mensaje) {
    try {
        await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
            chat_id: TELEGRAM_ID,
            text: mensaje,
            parse_mode: 'Markdown'
        });
    } catch (e) {
        console.error("Error al enviar Telegram:", e.message);
    }
}

async function iniciarBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
    
    const sock = makeWASocket({
        auth: state,
        logger: pino({ level: 'silent' })
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        if (qr) {
            qrCodeUltimo = qr;
            estadoConexion = "Esperando escaneo de QR";
        }

        if (connection === 'open') {
            estadoConexion = "Conectado";
            qrCodeUltimo = "";
            console.log('¡Conectado a WhatsApp exitosamente!');
            enviarTelegram("🟢 *Rastreador Node.js Iniciado*\nSesión vinculada correctamente.");
        } else if (connection === 'close') {
            estadoConexion = "Desconectado";
            const shouldReconnect = (lastDisconnect?.error instanceof Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) {
                iniciarBot();
            }
        }
    });

    sock.ev.on('presence.update', async (json) => {
        if (json.id === NUMERO_OBJETIVO) {
            const estado = json.presences[NUMERO_OBJETIVO]?.lastKnownPresence;
            if (estado === 'available') {
                enviarTelegram(`⚡ *¡ONLINE!* El número \`593996752239\` se ha conectado.`);
            } else if (estado === 'unavailable') {
                enviarTelegram(`💤 El número \`593996752239\` se ha desconectado.`);
            }
        }
    });
}

// Página web para mostrar el QR visualmente
app.get('/', async (req, res) => {
    if (qrCodeUltimo) {
        try {
            const urlImagenQR = await qrcode.toDataURL(qrCodeUltimo);
            res.send(`
                <div style="text-align:center; font-family:sans-serif; margin-top:50px;">
                    <h2>Vinculación de WhatsApp</h2>
                    <p>Escanea este código QR con la aplicación de WhatsApp:</p>
                    <img src="${urlImagenQR}" alt="Código QR WhatsApp" style="width:300px; height:300px;"/>
                    <p><b>Estado:</b> ${estadoConexion}</p>
                </div>
            `);
        } catch (err) {
            res.send("Generando código QR, por favor recarga la página en unos segundos...");
        }
    } else {
        res.send(`
            <div style="text-align:center; font-family:sans-serif; margin-top:50px;">
                <h2>Rastreador de WhatsApp Activo</h2>
                <p><b>Estado:</b> ${estadoConexion}</p>
            </div>
        `);
    }
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
    iniciarBot();
});
