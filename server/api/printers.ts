import {exec} from 'child_process';
import type {FastifyReply, FastifyRequest} from 'fastify';

function getInstalledPrinters(): Promise<string[]> {
    return new Promise((resolve) => {
        exec('lpstat -p', (error, stdout) => {
            if (error || !stdout.trim()) return resolve([]);
            const printers = stdout
                .split('\n')
                .filter(line => line.startsWith('printer '))
                .map(line => line.split(' ')[1]);
            resolve(printers);
        });
    });
}

export async function printers(_request: FastifyRequest, reply: FastifyReply) {
    const list = await getInstalledPrinters();
    reply.send({printers: list});
}