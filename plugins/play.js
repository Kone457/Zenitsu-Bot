const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function handler(conn, { message, args }) {
    const query = args.join(' ');
    if (!query) {
        return conn.sendMessage(message.key.remoteJid, { text: '💭 *Zenitsu* te recuerda: Por favor, ingresa un término de búsqueda para la canción. 🎶' });
    }

    try {
        const searchResponse = await axios.get(`https://eliasar-yt-api.vercel.app/api/search/youtube?query=${encodeURIComponent(query)}`);
        if (searchResponse.data && searchResponse.data.status && searchResponse.data.results.resultado.length > 0) {
            const firstResult = searchResponse.data.results.resultado[0];

            const messageText = `✨ *Zenitsu-Bot* ha encontrado un resultado: ✨\n\n` +
                                `🎵 *Título:* ${firstResult.title}\n` +
                                `⏳ *Duración:* ${firstResult.duration}\n` +
                                `📅 *Subido:* ${firstResult.uploaded}\n` +
                                `👀 *Vistas:* ${firstResult.views.toLocaleString()}\n\n` +
                                `🔽 *Descargando el audio...* 🎶\n\n` +
                                `🎧 *Zenitsu-Bot* se está encargando de todo para ti. ¡Espera un momento\n` +
                                `> Si lo desea en video, use *play2* *${firstResult.title}*`;

            const imageUrl = firstResult.thumbnail;

            await conn.sendMessage(message.key.remoteJid, { 
                image: { url: imageUrl },
                caption: messageText 
            });

            const downloadApis = [
                { url: `https://eliasar-yt-api.vercel.app/api/download/youtube?text=${encodeURIComponent(firstResult.url)}&format=mp3`, field: 'downloadInfo.downloadUrl' },
                { url: `https://api.nyxs.pw/dl/yt-direct?url=${encodeURIComponent(firstResult.url)}`, field: 'result.urlAudio' },
                { url: `https://api.dorratz.com/v2/yt-mp3?url=${encodeURIComponent(firstResult.url)}`, field: 'url' }
            ];

            let downloadUrl = null;
            for (let api of downloadApis) {
                try {
                    const response = await axios.get(api.url);
                    if (response.data && response.data.status) {
                        downloadUrl = getNestedValue(response.data, api.field);
                        if (downloadUrl) break;
                    }
                } catch (err) {}
            }

            if (downloadUrl) {
                await sendAudioAsFile(conn, message, downloadUrl, firstResult.title);
            } else {
                throw new Error('Ninguna API pudo proporcionar el audio.');
            }
        } else {
            await conn.sendMessage(message.key.remoteJid, { text: '🔍 *Zenitsu-Bot* no encontró resultados para tu búsqueda. Intenta con otro término. 💭' });
        }
    } catch (err) {
        await conn.sendMessage(message.key.remoteJid, { text: '⚠️ *Zenitsu-Bot* encontró un error al intentar descargar el archivo. Intenta con otro término de búsqueda. ❌' });
    }
}

async function sendAudioAsFile(conn, message, audioUrl, audioTitle) {
    const sanitizedTitle = audioTitle.replace(/[<>:"/\\|?*\x00-\x1F]/g, '');
    const audioPath = path.resolve(__dirname, `${Date.now()}_${sanitizedTitle}.mp3`);

    try {
        const writer = fs.createWriteStream(audioPath);
        const audioStream = await axios({
            url: audioUrl,
            method: 'GET',
            responseType: 'stream',
        });

        audioStream.data.pipe(writer);

        await new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });

        await conn.sendMessage(message.key.remoteJid, {
            document: { url: audioPath },
            mimetype: 'audio/mpeg',
            fileName: `${sanitizedTitle}.mp3`
        });

        fs.unlinkSync(audioPath);
    } catch (err) {
        await conn.sendMessage(message.key.remoteJid, { text: '⚠️ *Zenitsu-Bot* no pudo enviar el archivo de audio. Intenta nuevamente. ❌' });
    }
}

function getNestedValue(obj, path) {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
}

module.exports = {
    command: 'play',
    handler,
};