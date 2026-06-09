import type {FastifyReply, FastifyRequest, RequestGenericInterface} from 'fastify';
import {generateQRLabelZPL} from '../utils/generate-qr-zpl.ts';
import {sendZPLToUSBPrinter} from '../utils/helper.ts';

type PrintQRRequest = RequestGenericInterface & {
    Body: {
        printerName: string;
        url: string;
        labelWidth: number;
        labelHeight: number;
    }
}

export async function printQR(request: FastifyRequest<PrintQRRequest>, reply: FastifyReply) {
    const {printerName, url, labelWidth, labelHeight} = request.body;
    try {
        const zpl = await generateQRLabelZPL(url, labelWidth, labelHeight);
        await sendZPLToUSBPrinter(printerName, zpl);
        reply.send({status: 'QR label sent to printer'});
    } catch (error) {
        reply.status(500).send({error: 'Failed to print QR label', details: String(error)});
    }
}