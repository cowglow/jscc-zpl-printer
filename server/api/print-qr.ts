import type {FastifyReply, FastifyRequest, RequestGenericInterface} from 'fastify';
import {generateQRLabelZPL} from '../utils/generate-qr-zpl.ts';
import {enqueueJob} from '../printQueue.ts';

type PrintQRRequest = RequestGenericInterface & {
    Body: {
        url: string;
        labelWidth: number;
        labelHeight: number;
    }
}

export async function printQR(request: FastifyRequest<PrintQRRequest>, reply: FastifyReply) {
    const {url, labelWidth, labelHeight} = request.body;
    try {
        const zpl = await generateQRLabelZPL(url, labelWidth, labelHeight);
        const printJob = enqueueJob(zpl);
        reply.status(202).send({jobId: printJob.id});
    } catch (error) {
        reply.status(500).send({error: 'Failed to generate QR label', details: String(error)});
    }
}