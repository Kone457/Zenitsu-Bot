const fs = require('fs');
const path = require('path');
const { prefix } = require('./settings.js');
const dbPath = './database.json';
const chalk = require('chalk');
const pathPlugins = './plugins';

let plugins = {};

const readDB = () => {
    try {
        const data = fs.readFileSync(dbPath, 'utf-8');
        return JSON.parse(data);
    } catch (err) {
        return { groups: {}, comads: 0, users: 0 };
    }
};

const writeDB = (data) => {
    try {
        fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
        console.error('Error al escribir DB:', err);
    }
};

const incrementComms = () => {
    const db = readDB();
    db.comads += 1;
    writeDB(db);
};

const incrementGrups = () => {
    const db = readDB();
    db.users += 1;
    writeDB(db);
};

const incrementUsers = () => {
    const db = readDB();
    db.users += 1;
    writeDB(db);
};

const getWelcomeStatus = (groupId) => {
    const db = readDB();
    return db.groups[groupId]?.welcomeStatus || 'off';
};

const setWelcomeStatus = (groupId, status) => {
    const db = readDB();
    if (!db.groups[groupId]) db.groups[groupId] = {};
    db.groups[groupId].welcomeStatus = status;
    writeDB(db);
};

const sendText = async (conn, to, text, quoted = null) => {
    // Validar y sanitizar entrada
    if (!text || typeof text !== 'string') {
        console.warn('Intento de enviar texto inválido');
        return;
    }
    
    const sanitizedText = sanitizeInput(text);
    if (sanitizedText.length === 0) {
        console.warn('Texto vacío después de sanitización');
        return;
    }
    
    const messageOptions = { text: sanitizedText };
    if (quoted) {
        messageOptions.quoted = quoted;
    }
    
    try {
        await conn.sendMessage(to, messageOptions);
    } catch (error) {
        console.error('Error enviando mensaje de texto:', error.message);
    }
};

const sendImage = async (conn, to, image, caption = '', quoted = null) => {
    const messageOptions = { image, caption };
    if (quoted) {
        messageOptions.quoted = quoted;
    }
    await conn.sendMessage(to, messageOptions);
};

const sendSticker = async (conn, to, sticker, quoted = null) => {
    const messageOptions = { sticker };
    if (quoted) {
        messageOptions.quoted = quoted;
    }
    await conn.sendMessage(to, messageOptions);
};

const sendAudio = async (conn, to, audio, ptt = false, quoted = null) => {
    const messageOptions = { audio, ptt };
    if (quoted) {
        messageOptions.quoted = quoted;
    }
    await conn.sendMessage(to, messageOptions);
};

const sendVideo = async (conn, to, video, caption = '', quoted = null) => {
    const messageOptions = { video, caption };
    if (quoted) {
        messageOptions.quoted = quoted;
    }
    await conn.sendMessage(to, messageOptions);
};

const sendMedia = async (conn, to, media, caption = '', type = 'image', quoted = null) => {
    if (type === 'image') {
        await sendImage(conn, to, media, caption, quoted);
    } else if (type === 'sticker') {
        await sendSticker(conn, to, media, quoted);
    } else if (type === 'audio') {
        await sendAudio(conn, to, media, false, quoted);
    } else if (type === 'video') {
        await sendVideo(conn, to, media, caption, quoted);
    } else {
        await sendText(conn, to, 'Tipo de mensaje no soportado', quoted);
    }
};

const sendMessage = async (conn, to, message, type = 'text', quoted = null) => {
    if (type === 'text') {
        await sendText(conn, to, message, quoted);
    } else if (type === 'image') {
        await sendImage(conn, to, message, '', quoted);
    } else if (type === 'sticker') {
        await sendSticker(conn, to, message, quoted);
    } else if (type === 'audio') {
        await sendAudio(conn, to, message, false, quoted);
    } else if (type === 'video') {
        await sendVideo(conn, to, message, '', quoted);
    } else {
        await sendText(conn, to, 'Tipo de mensaje no soportado', quoted);
    }
};

const loadPlugins = () => {
    plugins = {};
    try {
        const files = fs.readdirSync(pathPlugins);
        files.forEach((file) => {
            if (file.endsWith('.js') && /^[a-zA-Z0-9_-]+\.js$/.test(file)) {
                try {
                    const pluginPath = path.resolve(pathPlugins, file);
                    delete require.cache[require.resolve(pluginPath)];
                    const command = require(pluginPath);
                    
                    // Validar estructura del plugin
                    if (command && 
                        typeof command.command === 'string' && 
                        typeof command.handler === 'function' &&
                        isValidCommand(command.command)) {
                        plugins[command.command] = command;
                    } else {
                        console.warn(`Plugin inválido: ${file}`);
                    }
                } catch (err) {
                    console.error(`Error cargando plugin ${file}:`, err.message);
                }
            }
        });
        console.log(`Plugins cargados: ${Object.keys(plugins).length}`);
    } catch (err) {
        console.error('Error leyendo directorio de plugins:', err.message);
    }
};

fs.watch(pathPlugins, { recursive: true }, (eventType, filename) => {
    if (eventType === 'change' || eventType === 'rename') {
        loadPlugins();
    }
});

loadPlugins();

async function logEvent(conn, m, type, user = 'Desconocido', groupName = '', groupLink = '') {
    console.log(
        chalk.bold.red('━━━━━━━━━━ 𝙕𝙚𝙣𝙞𝙩𝙨𝙪 𝘽𝙤𝙩  ━━━━━━━━━━') +
        '\n' + chalk.blue('│⏰ Fecha y hora: ') + chalk.green(new Date().toLocaleString('es-ES', { timeZone: 'America/Argentina/Buenos_Aires' })) +
        '\n' + chalk.yellow('️│🏷️ Modo: ') + chalk.magenta(`[${conn.public ? 'Público' : 'Privado'}]`) +
        '\n' + chalk.cyan('│📑 Tipo de mensaje: ') + chalk.white(type) +
        (m.isGroup ? 
            `\n${chalk.bgGreen('│🌟 Grupo:')} ${chalk.greenBright(groupName)} ➜ ${chalk.green(m.chat)}` +
            `\n${chalk.bgBlue('│🔗 Enlace del grupo:')} ${chalk.blueBright(groupLink)}` :
            `\n${chalk.bgMagenta('│💌 Usuario:')} ${chalk.magentaBright(user)}`)
    );
}

// Función para sanitizar texto y prevenir inyecciones
const sanitizeInput = (input) => {
    if (typeof input !== 'string') return '';
    
    // Remover caracteres peligrosos y limitar longitud
    return input
        .replace(/[<>'"&]/g, '') // Remover caracteres HTML peligrosos
        .replace(/javascript:/gi, '') // Remover javascript:
        .replace(/data:/gi, '') // Remover data:
        .replace(/vbscript:/gi, '') // Remover vbscript:
        .substring(0, 1000) // Limitar longitud
        .trim();
};

// Función para validar comandos
const isValidCommand = (command) => {
    return /^[a-zA-Z0-9_-]+$/.test(command) && command.length <= 20;
};

// Rate limiting simple
const userRateLimit = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minuto
const MAX_COMMANDS_PER_WINDOW = 10;

const checkRateLimit = (userId) => {
    const now = Date.now();
    const userLimit = userRateLimit.get(userId) || { count: 0, resetTime: now + RATE_LIMIT_WINDOW };
    
    if (now > userLimit.resetTime) {
        userLimit.count = 1;
        userLimit.resetTime = now + RATE_LIMIT_WINDOW;
    } else {
        userLimit.count++;
    }
    
    userRateLimit.set(userId, userLimit);
    return userLimit.count <= MAX_COMMANDS_PER_WINDOW;
};

async function handleMessage(conn, message) {
    if (!message || !message.key) return;
    
    const { message: msgContent, key } = message;
    const from = key.remoteJid;
    const isGroup = from.endsWith('@g.us');
    const user = key.participant || from;
    let groupName = '', groupLink = '';

    // Validar que el usuario no esté en la lista negra
    const userId = user.split('@')[0];
    if (!checkRateLimit(userId)) {
        console.warn(`Rate limit excedido para usuario: ${userId}`);
        return;
    }

    if (isGroup) {
        try {
            const metadata = await conn.groupMetadata(from);
            groupName = sanitizeInput(metadata.subject);
            const inviteCode = await conn.groupInviteCode(from);
            groupLink = `https://chat.whatsapp.com/${inviteCode}`;
        } catch {
            groupLink = 'Error obteniendo el enlace del grupo';
        }
    }

    // Mejorar la detección del texto del mensaje con sanitización
    let body = msgContent?.conversation || 
               msgContent?.extendedTextMessage?.text || 
               msgContent?.imageMessage?.caption || 
               msgContent?.videoMessage?.caption ||
               msgContent?.documentMessage?.caption ||
               msgContent?.buttonsResponseMessage?.selectedButtonId ||
               msgContent?.listResponseMessage?.singleSelectReply?.selectedRowId ||
               null;

    if (body && typeof body === 'string') {
        body = sanitizeInput(body);
        
        if (body.trim().startsWith(prefix[0])) {
            const args = body.slice(prefix[0].length).trim().split(/ +/).map(arg => sanitizeInput(arg));
            const commandName = args.shift().toLowerCase();

            // Validar comando
            if (!isValidCommand(commandName)) {
                console.warn(`Comando inválido detectado: ${commandName} de usuario: ${userId}`);
                return;
            }

            if (plugins[commandName] && typeof plugins[commandName].handler === 'function') {
                try {
                    // Crear objeto de mensaje más completo con datos sanitizados
                    const messageObj = {
                        message,
                        args,
                        key,
                        from,
                        isGroup,
                        body,
                        user,
                        groupName,
                        groupLink,
                        quoted: message
                    };
                    
                    await plugins[commandName].handler(conn, messageObj);
                    await logEvent(conn, message, `Comando: ${commandName}`, user, groupName, groupLink);
                    incrementComms();
                } catch (error) {
                    console.error(`Error ejecutando comando ${commandName}:`, error.message);
                    // No enviar detalles del error al usuario por seguridad
                }
            }
        }
    }
}


async function handleGroupEvents(conn, update) {
    try {
        const { id, participants, action } = update;
        const welcomeStatus = getWelcomeStatus(id);
        
        if (welcomeStatus === 'on' && (action === 'add' || action === 'remove')) {
            const metadata = await conn.groupMetadata(id);
            const groupName = metadata.subject;
            
            for (const participant of participants) {
                if (action === 'add') {
                    const welcomeText = `¡Bienvenido/a @${participant.split('@')[0]} al grupo *${groupName}*! 🎉`;
                    await conn.sendMessage(id, { 
                        text: welcomeText,
                        mentions: [participant]
                    });
                } else if (action === 'remove') {
                    const farewellText = `@${participant.split('@')[0]} ha salido del grupo *${groupName}*. ¡Hasta pronto! 👋`;
                    await conn.sendMessage(id, { 
                        text: farewellText,
                        mentions: [participant]
                    });
                }
            }
        }
    } catch (error) {
        console.error('Error en handleGroupEvents:', error);
    }
}

module.exports = { 
    handleMessage, 
    handleGroupEvents, 
    sendMedia, 
    sendMessage,
    sendText,
    sendImage,
    sendSticker,
    sendAudio,
    sendVideo,
    incrementComms, 
    incrementGrups, 
    incrementUsers, 
    getWelcomeStatus, 
    setWelcomeStatus 
};