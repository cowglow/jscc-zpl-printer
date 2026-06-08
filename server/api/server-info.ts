import os from 'os';
import type {FastifyReply, FastifyRequest} from 'fastify';
import {SERVER_PORT} from '../constants.ts';

function getLocalIP(): string {
    const interfaces = os.networkInterfaces();
    for (const iface of Object.values(interfaces)) {
        for (const entry of iface ?? []) {
            if (entry.family === 'IPv4' && !entry.internal) {
                return entry.address;
            }
        }
    }
    return 'localhost';
}

export async function serverInfo(_request: FastifyRequest, reply: FastifyReply) {
    const ip = getLocalIP();
    reply.send({url: `http://${ip}:${SERVER_PORT}`});
}