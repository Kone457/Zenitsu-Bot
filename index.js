const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const readline = require('readline');
const pino = require('pino');
const chalk = require('chalk');
const figlet = require('figlet');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (text) => new Promise((resolve) => rl.question(text, resolve));

async function startBot() {
    console.clear();
    figlet('Zenitsu', {
        font: 'Standard',
        horizontalLayout: 'full'
    }, (err, data) => {
        if (err) {
            console.log(chalk.red('Error generando el banner ASCII'));
            console.log(err);
            return;
        }
        console.log(chalk.magenta.bold(data));
        console.log(chalk.cyan('━'.repeat(50)));
        console.log(chalk.green.bold(' Bot de WhatsApp basado en Baileys'));
        console.log(chalk.cyan('━'.repeat(50)));
    });

    await new Promise(resolve => setTimeout(resolve, 2000));

    console.clear();

    const { state, saveCreds } = await useMultiFileAuthState('./sessions');
    const { version } = await fetchLatestBaileysVersion();

    let opcion;
    if (!fs.existsSync('./sessions/creds.json')) {
        do {
            console.log('\n' + chalk.cyan('╭' + '━'.repeat(40) + '╮'));
            console.log(chalk.cyan('│') + chalk.magenta.bold(' 𝓢𝓮𝓵𝓮𝓬𝓬𝓲𝓸𝓷𝓪 𝓶𝓮́𝓽𝓸𝓭𝓸 𝓭𝓮 𝓬𝓸𝓷𝓮𝔁𝓲𝓸́𝓷 ') + chalk.cyan('│'));
            console.log(chalk.cyan('├' + '━'.repeat(40) + '┤'));
            console.log(chalk.cyan('│') + chalk.yellow(' [1]') + chalk.white(' Conexión mediante QR') + ' '.repeat(13) + chalk.cyan('│'));
            console.log(chalk.cyan('│') + chalk.yellow(' [2]') + chalk.white(' Conexión mediante número') + ' '.repeat(9) + chalk.cyan('│'));
            console.log(chalk.cyan('╰' + '━'.repeat(40) + '╯\n'));
            
            opcion = await question(chalk.magenta('┏━━━❯ ') + chalk.white('Ingresa tu opción: '));

            if (!/^[1-2]$/.test(opcion)) {
                console.log(chalk.bold.redBright(`NO SE PERMITE NÚMEROS QUE NO SEAN ${chalk.bold.greenBright("1")} O ${chalk.bold.greenBright("2")}, TAMPOCO LETRAS O SÍMBOLOS ESPECIALES.\n${chalk.bold.yellowBright("CONSEJO: COPIE EL NÚMERO DE LA OPCIÓN Y PÉGUELO EN LA CONSOLA.")}`));
            }
        } while (opcion !== '1' && opcion !== '2' || fs.existsSync('./sessions/creds.json'));
    }

    const socket = makeWASocket({
        version,
        auth: state,
        logger: pino({ level: 'silent' }),
    });

    if (opcion === '2') {
        let phoneNumber = await question('Introduce tu número de teléfono (Ej: +123456789): ');
        phoneNumber = phoneNumber.replace(/\D/g, '');
        const pairingCode = await socket.requestPairingCode(phoneNumber);
        console.log(`Código de emparejamiento: ${pairingCode}`);
    }

    socket.ev.on('connection.update', (update) => {
        const { connection, qr } = update;
        if (connection === 'open') {
            figlet(`Zenitsu|Bot`, {
                font: 'Standard'
            }, (err, data) => {
                if (err) {
                    console.log('Error generando el banner ASCII');
                    console.log(err);
                    return;
                }
                console.log(chalk.magenta(data));
                console.log(`Bot conectado como ${socket.user.id}`);
            });
        }

        if (connection === 'close') {
            console.log(chalk.yellowBright('Bot desconectado, intentando reconectar...'));
            startBot();
        }

        if (qr) qrcode.generate(qr, { small: true });
    });

    socket.ev.on('creds.update', saveCreds);

    socket.ev.on('messages.upsert', async (m) => {
        try {
            const main = require('./main.js');
            await main.handleMessage(socket, m.messages[0]);
        } catch (err) {
            console.error('Error procesando el mensaje:', err.message);
        }
    });

    socket.ev.on('group-participants.update', async (update) => {
        try {
            const main = require('./main.js');
            await main.handleGroupEvents(socket, update);
        } catch (err) {
            console.error('Error procesando evento de grupo:', err.message);
        }
    });
}

startBot();