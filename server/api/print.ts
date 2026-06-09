import {enqueueJob} from '../printQueue.ts';
import type {FastifyReply, FastifyRequest, RequestGenericInterface} from "fastify";

type PrintRequest = RequestGenericInterface & {
    Body: { zpl: string; printerName?: string }
}

export async function print(request: FastifyRequest<PrintRequest>, reply: FastifyReply) {
    const {zpl, printerName} = request.body;
    if (!zpl) {
        reply.status(400).send({error: 'ZPL string is required'});
        return;
    }
    const printJob = enqueueJob(zpl, printerName || undefined);
    reply.status(202).send({jobId: printJob.id});
}