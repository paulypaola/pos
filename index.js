const express = require('express');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 10000;

const TELEGRAM_TOKEN = "8959408870:AAGmrKCpVK8HxbACmGIVhQjR1-yGubmh2s0";
const TELEGRAM_ID = "7410396096";
const NUMERO_OBJETIVO = "593996752239";

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

app.get('/', (req, res) => {
    res.send(`
        <div style="text-align:center; font-family:sans-serif; margin-top:50px;">
            <h2>Monitoreo Activo</h2>
            <p>El servicio de rastreo para el número <b>${NUMERO_OBJETIVO}</b> está en ejecución.</p>
        </div>
    `);
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
    enviarTelegram("🟢 *Servidor de monitoreo iniciado correctamente en Render.*");
});
