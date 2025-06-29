import {sendZPLToUSBPrinter} from "../utils/helper.ts";
import type {FastifyReply, FastifyRequest, RequestGenericInterface} from "fastify";

type PrintRequest = RequestGenericInterface & {
    Body: {
        zpl: string;
        printerName: string;
    }
}

export async function print(request: FastifyRequest<PrintRequest>, reply: FastifyReply) {
    const {zpl, printerName} = request.body;
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
}
