const { makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const pino = require('pino');
const express = require('express');
const axios = require('axios');
const qrcode = require('qrcode-terminal');

const app = express();
const PORT = process.env.PORT || 10000;

const TELEGRAM_TOKEN = "8959408870:AAGmrKCpVK8HxbACmGIVhQjR1-yGubmh2s0";
const TELEGRAM_ID = "7410396096";
const NUMERO_OBJETIVO = "593996752239@s.whatsapp.net";

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
            console.log('Escanea el siguiente código QR con tu WhatsApp:');
            qrcode.generate(qr, { small: true });
        }

        if (connection === 'open') {
            console.log('¡Conectado a WhatsApp exitosamente!');
            enviarTelegram("🟢 *Rastreador Node.js Iniciado*\nSesión vinculada correctamente.");
        } else if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error instanceof Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('Conexión cerrada, reconectando...', shouldReconnect);
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

app.get('/', (req, res) => {
    res.send('Bot de Rastreo Node.js Activo');
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
    iniciarBot();
});
