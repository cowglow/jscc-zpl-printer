import {exec} from 'child_process';
import type {FastifyReply, FastifyRequest} from 'fastify';

function getActivePrinters(): Promise<string[]> {
    return new Promise((resolve) => {
        exec('lpstat -p', (error, stdout) => {
            if (error || !stdout.trim()) return resolve([]);
            const printers = stdout
                .split('\n')
                .filter(line => line.startsWith('printer ') && /is (idle|processing)/.test(line))
                .map(line => line.split(' ')[1]);
            resolve(printers);
        });
    });
}

export async function printers(_request: FastifyRequest, reply: FastifyReply) {
    const list = await getActivePrinters();
    reply.send({printers: list});
}