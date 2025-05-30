import Fastify from 'fastify';
import cors from '@fastify/cors';
import { exec } from 'child_process';

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

        exec(cmd, (error: any, _stdout: string, stderr: string) => {
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

// echo "^XA^FO10,100^A0,N,136,136^FD#JSCC25^FS^FO100,240^A0,N,100,100^FDPHILIP SAA^FS^XZ" | nc 192.168.1.16 9100
