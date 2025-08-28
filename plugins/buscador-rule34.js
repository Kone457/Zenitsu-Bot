const axios = require('axios'); 

const thumbnailUrl = 'https://qu.ax/MvYPM.jpg';

const contextInfo = {
  externalAdReply: {
    title: '🔞 Rule34 Summon',
    body: 'Imágenes invocadas desde el abismo de internet...',
    mediaType: 1,
    previewType: 0,
    sourceUrl: 'https://delirius-apiofc.vercel.app',
    thumbnailUrl
  }
};

async function handler(conn, { message, args }) {
  const jid = message.key.remoteJid;
  const isGroup = jid.endsWith('@g.us');
  
  
  if (isGroup) {
    const { getNsfwStatus } = require('../main');
    const nsfwEnabled = getNsfwStatus(jid);
    
    if (nsfwEnabled === 'off') {
      return conn.sendMessage(jid, {
        text: '🔞 *Contenido NSFW deshabilitado en este grupo.*\n\n> Los administradores pueden activarlo con: `nsfw on`\n\n> Zenitsu está aliviado... ¡estos comandos le dan mucha vergüenza! 😳',
      }, { quoted: message });
    }
  }
  const quoted = message;
  const query = args.join(' ');

  if (!query) {
    return conn.sendMessage(jid, {
      text: '*🔍 ¿Qué deseas buscar?*\n\n> Escribe un término para buscar imágenes en Rule34.',
      contextInfo
    }, { quoted });
  }

  try {
    const apiUrl = `https://delirius-apiofc.vercel.app/search/rule34?query=${encodeURIComponent(query)}`;
    const response = await axios.get(apiUrl);
    const images = response.data.images;

    if (!images || images.length === 0) {
      return conn.sendMessage(jid, {
        text: `*❌ No se encontraron resultados para:* ${query}`,
        contextInfo
      }, { quoted });
    }

    const imagesToSend = images.slice(0, 5); 

    for (const imageUrl of imagesToSend) {
      const caption = `
╭─「 🔞 𝗥𝗨𝗟𝗘𝟯𝟰 - 𝗦𝗨𝗠𝗠𝗢𝗡 」─╮
│ 🔍 *Búsqueda:* ${query}
│ 🌐 *Fuente:* Delirius 
╰────────────────────────╯
*✨ Imagen invocada...*
`.trim();

      await conn.sendMessage(jid, {
        image: { url: imageUrl },
        caption,
        contextInfo,
      }, { quoted });
    }

  } catch (error) {
    console.error('Error al obtener imágenes de Rule34:', error);
    conn.sendMessage(jid, {
      text: '*❌ Ocurrió un error al procesar la solicitud. Inténtalo de nuevo más tarde.*',
      contextInfo
    }, { quoted });
  }
}

module.exports = {
  command: 'rule34',
  handler
};
