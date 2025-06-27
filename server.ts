import Fastify from 'fastify';
import cors from '@fastify/cors';
import {sendZPLToUSBPrinter} from "./src/send-zpl-to-usb-printer.ts";
import {fileURLToPath} from "node:url";
import path from "node:path";
import fastifyStatic from "@fastify/static";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fastify = Fastify({logger: true});

fastify.register(fastifyStatic, {
    root: path.join(__dirname, "dist"),
    prefix: "/ts-print-zpl-via-socket/"
})
fastify.register(cors, {
    origin: true,
});

fastify.get('/', async (_, reply) => {
    return reply.sendFile("index.html")
    // return {status: 'Server is running!'};
});

fastify.post('/print', async (request, reply) => {
    const {zpl, printerName} = request.body as { zpl: string, printerName: string };
    if (!zpl) {
        reply.status(400).send({error: 'ZPL string is required'});
        return;
    }
    try {
        await sendZPLToUSBPrinter(printerName, zpl);
        reply.send({status: 'ZPL sent to printer'});
    } catch (error) {
        reply.status(500).send({error: 'Failed to send ZPL to printer', details: error});
    }
});

try {
    await fastify.listen({port: 9100, host: '0.0.0.0'})
} catch (err) {
    fastify.log.error(err);
    process.exit(1);
}
// fastify.listen({port: 9100}).then(() => {
//     console.log("==========================================================")
//     console.log("= 🚀 Fastify server started on http://localhost:9100     =");
//     console.log("==========================================================")
// });

// Example command to send ZPL to a printer from Mac (nc):
// echo "^XA^FO10,100^A0,N,136,136^FD#JSCC25^FS^FO100,240^A0,N,100,100^FDPHILIP SAA^FS^XZ" | nc 192.168.1.16 9100

// Example command to send ZPL to a printer from Windows (ncat):
// echo "^XA^FO10,100^A0,N,136,136^FD#JSCC25^FS^FO100,240^A0,N,100,100^FDPHILIP SAA^FS^XZ" | ncat 192.168.1.16 9100


