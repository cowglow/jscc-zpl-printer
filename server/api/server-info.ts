import os from 'os';
import {exec} from 'child_process';
import type {FastifyReply, FastifyRequest} from 'fastify';
import {SERVER_PORT} from '../constants.ts';

const DPI = 300;
const HUNDREDTHS_OF_MM_PER_INCH = 2540;

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

function getLabelDots(printerName: string): Promise<{width: number; height: number}> {
    const fallback = {width: 1200, height: 1800};

    if (process.env.LABEL_WIDTH_DOTS && process.env.LABEL_HEIGHT_DOTS) {
        return Promise.resolve({
            width: Number(process.env.LABEL_WIDTH_DOTS),
            height: Number(process.env.LABEL_HEIGHT_DOTS),
        });
    }

    return new Promise((resolve) => {
        const url = `http://localhost:631/printers/${printerName}`;
        exec(`ipptool -t "${url}" get-printer-attributes.test`, (error, stdout) => {
            if (error) return resolve(fallback);
            // IPP returns x/y dimensions in hundredths of mm
            const match = stdout.match(/media-col-default[^}]+x-dimension=(\d+)\s+y-dimension=(\d+)/);
            if (!match) return resolve(fallback);
            const width = Math.round((parseInt(match[1]) / HUNDREDTHS_OF_MM_PER_INCH) * DPI);
            const height = Math.round((parseInt(match[2]) / HUNDREDTHS_OF_MM_PER_INCH) * DPI);
            console.info(`[label] ${parseInt(match[1]) / 100}mm × ${parseInt(match[2]) / 100}mm → ${width}×${height} dots`);
            resolve({width, height});
        });
    });
}

export async function serverInfo(_request: FastifyRequest, reply: FastifyReply) {
    const ip = getLocalIP();
    const printerName = process.env.PRINTER_NAME || 'Intermec_PC43t_300_FP';
    const label = await getLabelDots(printerName);
    reply.send({url: `http://${ip}:${SERVER_PORT}`, label});
}