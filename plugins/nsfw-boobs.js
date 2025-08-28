const axios = require('axios');
const path = require('path');

const thumbnailUrl = 'https://qu.ax/MvYPM.jpg'; 

const contextInfo = {
  externalAdReply: {
    title: '⚡ Zenitsu-Bot',
    body: '¡Estoy temblando, pero haré lo que me pides!',
    mediaType: 1,
    previewType: 0,
    mediaUrl: 'https://zenitsu.bot',
    sourceUrl: 'https://zenitsu.bot',
    thumbnailUrl,
  },
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

  
  await conn.sendMessage(
    jid,
    {
      text: '⚡ *¡¿Q-qué?! ¡Me has pedido algo atrevido! Estoy temblando... pero aquí va...*',
      contextInfo,
    },
    { quoted: message }
  );

  
  const apiUrl = `https://delirius-apiofc.vercel.app/nsfw/boobs`;

  try {
    const response = await axios.get(apiUrl, { responseType: 'arraybuffer' });
    const imageBuffer = Buffer.from(response.data, 'binary');


    const messageText = `
╭「 ⚡ 𝙕𝙀𝙉𝙄𝙏𝙎𝙐 - 𝙍𝙀𝙎𝙋𝙐𝙀𝙎𝙏𝘼 」╮
│ 😱 ¡No puedo creer que haya hecho esto!
│ 👑 Creador : *Carlos* 
╰────────────────────╯

¡Aquí tienes... por favor, no le digas a nadie! 😳
`.trim();

    await conn.sendMessage(
      jid,
      {
        image: imageBuffer,
        caption: messageText,
        contextInfo,
      },
      { quoted: message }
    );
  } catch (err) {
    console.error('⚠️ Error al invocar la API de Delirius:', err.message);
    await conn.sendMessage(
      jid,
      {
        text: `❌ ¡Algo salió mal! Zenitsu se desmayó... ¡no pude obtener la imagen!\n🛠️ ${err.message}`,
        contextInfo,
      },
      { quoted: message }
    );
  }
}

module.exports = {
  command: 'boobs',
  handler,
};
