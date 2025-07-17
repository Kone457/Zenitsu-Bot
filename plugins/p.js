const os = require('os');
const si = require('systeminformation');
const { performance } = require('perf_hooks');

async function handler(conn, { message }) {
    try {
        async function getSystemInfo() {
            const disk = await si.fsSize();
            const memInfo = await si.mem();
            const load = await si.currentLoad();
            const cpus = os.cpus();

            let timestamp = performance.now();
            let latency = performance.now() - timestamp;

            const data = {
                latencia: `${latency.toFixed(4)} ms`,
                plataforma: os.platform(),
                núcleosCPU: cpus.length,
                modeloCPU: cpus[0].model,
                arquitecturaSistema: os.arch(),
                versiónSistema: os.release(),
                procesosActivos: os.loadavg()[0].toFixed(2),
                porcentajeCPUUsada: load.currentLoad.toFixed(2) + '%',
                ramUsada: `${(memInfo.used / (1024 ** 3)).toFixed(2)} GB`,
                ramTotal: `${(memInfo.total / (1024 ** 3)).toFixed(2)} GB`,
                ramLibre: `${(memInfo.free / (1024 ** 3)).toFixed(2)} GB`,
                porcentajeRAMUsada: `${((memInfo.used / memInfo.total) * 100).toFixed(2)}%`,
                espacioTotalDisco: `${(disk[0].size / (1024 ** 3)).toFixed(2)} GB`,
                espacioLibreDisco: `${(disk[0].available / (1024 ** 3)).toFixed(2)} GB`,
                uptime: `${Math.floor(os.uptime() / (60 * 60 * 24))}d ${Math.floor((os.uptime() % (60 * 60 * 24)) / (60 * 60))}h ${Math.floor((os.uptime() % (60 * 60)) / 60)}m`,
                cargaPromedio: os.loadavg().map((avg, index) => `${index + 1} min: ${avg.toFixed(2)}`).join(', '),
                horaActual: new Date().toLocaleString(),
                detallesCPUNúcleo: cpus.map((cpu, i) => `Núcleo ${i + 1}: ${(cpu.times.user / 100).toFixed(2)}%`).join('\n'),
                rutaActual: process.cwd(),
                versiónNode: process.version,
            };

            return data;
        }

        getSystemInfo().then((data) => {
            const responseMessage = `
🌐 *Latencia:* ${data.latencia}
💻 *Plataforma:* ${data.plataforma}
⚡ *Núcleos de CPU:* ${data.núcleosCPU}
🖥️ *Modelo CPU:* ${data.modeloCPU}
🏗️ *Arquitectura:* ${data.arquitecturaSistema}
🖥️ *Versión Sistema:* ${data.versiónSistema}
📊 *Procesos Activos:* ${data.procesosActivos}
⚙️ *Porcentaje CPU Usada:* ${data.porcentajeCPUUsada}
💾 *RAM Usada:* ${data.ramUsada} / ${data.ramTotal} (${data.porcentajeRAMUsada})
💿 *Espacio en Disco:* ${data.espacioLibreDisco} de ${data.espacioTotalDisco}
⏳ *Uptime:* ${data.uptime}
📈 *Carga Promedio:* ${data.cargaPromedio}
🧠 *Detalles CPU:*\n${data.detallesCPUNúcleo}
📂 *Ruta Actual:* ${data.rutaActual}
🔧 *Versión Node.js:* ${data.versiónNode}
`.trim();

            conn.sendMessage(message.key.remoteJid, {
                text: responseMessage
            }, {
                quoted: message,
                ephemeralExpiration: 24 * 60 * 100,
                disappearingMessagesInChat: 24 * 60
            });
        });
    } catch (err) {
        console.error("Error al obtener la información del servidor:", err.message);
        await conn.sendMessage(message.key.remoteJid, { text: 'Hubo un error al procesar tu solicitud. Intenta más tarde.' });
    }
}

module.exports = {
    command: ['p', 'ping'],
    handler,
};