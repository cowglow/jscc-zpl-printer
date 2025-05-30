import Fastify from 'fastify';
import cors from '@fastify/cors';

const PRINTER_NAME = "Intermec_PC43t_300_FP";
const fastify = Fastify({logger: true});

fastify.register(cors, {
    origin: "http://localhost:3000",
});

fastify.get('/', async () => {
    return {status: 'Server is running!'};
});

const sendZPLToUSBPrinter = (printerName: string, zpl: string) => {
    return new Promise<void>((resolve, reject) => {
        // Escape double quotes in ZPL to avoid shell issues
        const safeZPL = zpl.replace(/"/g, '\\"');
        const cmd = `echo "${safeZPL}" | lp -d ${printerName} -o raw`;
        console.log(cmd)
        const {exec} = require('child_process');
        exec(cmd, (error: any, stdout: string, stderr: string) => {
            if (error || stderr) {
                reject(error || stderr);
            } else {
                resolve();
            }
        });
    });
};

fastify.post('/print', async (request, reply) => {
    const {zpl} = request.body as { zpl: string };
    if (!zpl) {
        reply.status(400).send({error: 'ZPL string is required'});
        return;
    }
    try {
        await sendZPLToUSBPrinter(PRINTER_NAME, zpl);
        reply.send({status: 'ZPL sent to printer'});
    } catch (error) {
        reply.status(500).send({error: 'Failed to send ZPL to printer', details: error});
    }
});

fastify.listen({port: 9100}).then(() => {
    console.log("==========================================================")
    console.log("= 🚀 Fastify server started on http://localhost:9100     =");
    console.log("==========================================================")
});
/*

const SERVER_IP = "192.168.1.16"
const SERVER_PORT = 9100;
const fastify = Fastify({logger: true});

// Enable CORS
fastify.register(cors, {
    origin: 'http://localhost:3000', // Allow requests from your frontend
});

fastify.get('/', async () => {
    return {status: 'Server is running!'};
});

const sendZPLToPrinter = (ip: string, port: number, message: string) => {
    const client = new net.Socket();

    console.log(message)
    console.log('\n--------------------')
    client.connect(port, ip, () => {
        console.log('🟢 Connected to the printer. Sending ZPL...');
        client.write(message);
        client.end();
    });

    client.on('error', (error) => {
        console.error(`❌ Error connecting to the printer: ${error.message}`);
    });

    client.on('close', () => {
        console.log('🔴 Connection to the printer closed.');
    });
};

// New POST endpoint to send ZPL
fastify.post('/print', async (request, reply) => {
    const {zpl} = request.body as { zpl: string };
    const sanitizedZPL = zpl.replace("\n", "")

    if (!zpl) {
        reply.status(400).send({error: 'ZPL string is required'});
        return;
    }

    try {
        console.log({sanitizedZPL});
        // sendZPLToPrinter(SERVER_IP, SERVER_PORT, sanitizedZPL);
        reply.send({status: 'ZPL sent to printer'});

    } catch (error) {
        reply.status(500).send({error: 'Failed to send ZPL to printer'});
    }
});

const startServer = async () => {
    try {
        await fastify.listen({port: SERVER_PORT});
        console.log(`🚀 Fastify server started on http://localhost:${SERVER_PORT}`);

        // 3-second delay
        setTimeout(() => {
            console.log('⏰ 3 seconds passed, sending ZPL to printer...');
            const message = "" +
                "^XA" +
                "^FO48,128" +
                "^A0,N,100,100" +
                "^FD!Server Ready!^FS" +
                "^XZ"
            sendZPLToPrinter(SERVER_IP, SERVER_PORT, message);
        }, 3000);

    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

startServer().then(() => console.log('Server started successfully!'));
*/


// echo "^XA^FO10,100^A0,N,136,136^FD#JSCC25^FS^FO100,240^A0,N,100,100^FDPHILIP SAA^FS^XZ" | nc 192.168.1.16 9100
