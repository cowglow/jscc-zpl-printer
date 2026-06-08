import os from 'os';
import {exec} from 'child_process';
import type {FastifyReply, FastifyRequest} from 'fastify';
import {SERVER_PORT} from '../constants.ts';

const DPI = 300;

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

function getLabelDots(printerName: string): Promise<{ width: number; height: number }> {
    const fallback = {width: 1200, height: 1800}; // 4"x6" at 300dpi
    return new Promise((resolve) => {
        exec(`lpoptions -p ${printerName} -l`, (error, stdout) => {
            if (error) return resolve(fallback);
            const match = stdout.match(/\*d-o(\d+)x(\d+)/);
            if (!match) return resolve(fallback);
            // CUPS reports in hundredths of inches — convert to dots at 300dpi
            resolve({
                width: Math.round((parseInt(match[1]) / 100) * DPI),
                height: Math.round((parseInt(match[2]) / 100) * DPI),
            });
        });
    });
}

export async function serverInfo(_request: FastifyRequest, reply: FastifyReply) {
    const ip = getLocalIP();
    const printerName = process.env.PRINTER_NAME || 'Intermec_PC43t_300_FP';
    const label = await getLabelDots(printerName);
    reply.send({
        url: `http://${ip}:${SERVER_PORT}`,
        label,
    });
}