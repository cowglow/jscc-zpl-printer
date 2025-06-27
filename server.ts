import Fastify from 'fastify';
import cors from '@fastify/cors';
import {sendZPLToUSBPrinter} from "./src/send-zpl-to-usb-printer.ts";


const fastify = Fastify({logger: true});

fastify.register(cors, {
    origin: "http://localhost:3000",
});

fastify.get('/', async () => {
    return {status: 'Server is running!'};
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

fastify.listen({port: 9100}).then(() => {
    console.log("==========================================================")
    console.log("= 🚀 Fastify server started on http://localhost:9100     =");
    console.log("==========================================================")
});

// Example command to send ZPL to a printer from Mac (nc):
// echo "^XA^FO10,100^A0,N,136,136^FD#JSCC25^FS^FO100,240^A0,N,100,100^FDPHILIP SAA^FS^XZ" | nc 192.168.1.16 9100

// Example command to send ZPL to a printer from Windows (ncat):
// echo "^XA^FO10,100^A0,N,136,136^FD#JSCC25^FS^FO100,240^A0,N,100,100^FDPHILIP SAA^FS^XZ" | ncat 192.168.1.16 9100


