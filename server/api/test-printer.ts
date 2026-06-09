import {exec} from 'child_process';
import type {FastifyReply, FastifyRequest, RequestGenericInterface} from 'fastify';

type TestPrinterRequest = RequestGenericInterface & {
    Body: { printerName: string }
}

function checkCupsPrinter(printerName: string): Promise<{ready: boolean; message: string}> {
    return new Promise((resolve) => {
        exec(`lpstat -p ${JSON.stringify(printerName)}`, (error, stdout) => {
            if (error || !stdout.trim()) {
                resolve({ready: false, message: `Printer "${printerName}" not found in CUPS`});
                return;
            }
            const idle = stdout.includes('idle') || stdout.includes('enabled');
            if (idle) {
                resolve({ready: true, message: `Printer "${printerName}" is ready`});
            } else {
                resolve({ready: false, message: `Printer "${printerName}" is not ready: ${stdout.trim()}`});
            }
        });
    });
}

export async function testPrinterConnection(request: FastifyRequest<TestPrinterRequest>, reply: FastifyReply) {
    const {printerName} = request.body;
    if (!printerName) {
        reply.status(400).send({error: 'printerName is required'});
        return;
    }
    const {ready, message} = await checkCupsPrinter(printerName);
    if (ready) {
        reply.send({status: 'connected', message});
    } else {
        reply.status(500).send({status: 'error', message});
    }
}