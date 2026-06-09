import type {FastifyReply, FastifyRequest, RequestGenericInterface} from 'fastify';
import {jamPrinter, recoverPrinter} from '../printQueue.ts';

type PrinterParams = RequestGenericInterface & {
    Params: { id: string }
}

export async function recover(request: FastifyRequest<PrinterParams>, reply: FastifyReply) {
    const {id} = request.params;
    const ok = recoverPrinter(id);
    if (ok) {
        reply.send({recovered: id});
    } else {
        reply.status(404).send({error: `Printer "${id}" not found or not down`});
    }
}

export async function jam(request: FastifyRequest<PrinterParams>, reply: FastifyReply) {
    const {id} = request.params;
    const ok = jamPrinter(id);
    if (ok) {
        reply.send({jammed: id});
    } else {
        reply.status(404).send({error: `Printer "${id}" not found or already down`});
    }
}