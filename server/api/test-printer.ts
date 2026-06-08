import net from 'net';
import type {FastifyReply, FastifyRequest, RequestGenericInterface} from 'fastify';

const PRINTER_PORT = 9100;

type TestPrinterRequest = RequestGenericInterface & {
    Body: { printerIP: string }
}

export async function testPrinterConnection(request: FastifyRequest<TestPrinterRequest>, reply: FastifyReply) {
    const {printerIP} = request.body;
    if (!printerIP) {
        reply.status(400).send({error: 'printerIP is required'});
        return;
    }
    return new Promise<void>((resolve) => {
        const socket = new net.Socket();
        socket.setTimeout(3000);
        socket.connect(PRINTER_PORT, printerIP, () => {
            socket.destroy();
            reply.send({status: 'connected', message: `Printer at ${printerIP}:${PRINTER_PORT} is reachable`});
            resolve();
        });
        socket.on('error', (err) => {
            reply.status(500).send({status: 'error', message: `Cannot reach printer at ${printerIP}:${PRINTER_PORT}`, details: err.message});
            resolve();
        });
        socket.on('timeout', () => {
            socket.destroy();
            reply.status(500).send({status: 'timeout', message: `Connection to ${printerIP}:${PRINTER_PORT} timed out`});
            resolve();
        });
    });
}