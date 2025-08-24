async function handler(conn, { message }) {
  const jid = message.key.remoteJid;
  const quoted = message;

  try {
    const imageUrl = 'https://o.uguu.se/nQvVhygq.jpg';

    const contextInfo = {
      externalAdReply: {
        title: '🪄 Cenix - Invocación Visual',
        body: 'Una imagen que susurra desde el otro lado...',
        mediaType: 1,
        previewType: 0,
        sourceUrl: imageUrl,
        thumbnailUrl: 'https://qu.ax/MvYPM.jpg'
      }
    };

    const caption = `
╭─「 🖼️ 𝘾𝙀𝙉𝙄𝙓 - 𝙄𝙈𝘼𝙂𝙀𝙉 」─╮
│ ✨ *Estado:* Imagen enviada
│ 🎨 Ritual por: *Carlos*
╰─────────────────────╯
*📥 Aquí está...*
`.trim();

    await conn.sendMessage(jid, {
      image: { url: imageUrl },
      caption,
      contextInfo
    }, { quoted });

  } catch (err) {
    console.error('💥 Error en el comando Cenix:', err.message);
    await conn.sendMessage(jid, {
      text: '*⚠️ No se pudo enviar la imagen.*\n\n> 🧵 El hilo visual se ha enredado...',
      contextInfo: {
        externalAdReply: {
          title: '🪄 Cenix - Invocación Visual',
          body: 'Error en la conexión estética...',
          mediaType: 1,
          previewType: 0,
          sourceUrl: imageUrl,
          thumbnailUrl: 'https://qu.ax/MvYPM.jpg'
        }
      }
    }, { quoted });
  }
}

module.exports = {
  command: 'Cenix',
  handler
};