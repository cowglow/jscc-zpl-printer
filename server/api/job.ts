import type {FastifyReply, FastifyRequest, RequestGenericInterface} from 'fastify';
import {getJob} from '../printQueue.ts';

type JobParams = RequestGenericInterface & {
    Params: { id: string }
}

export async function job(request: FastifyRequest<JobParams>, reply: FastifyReply) {
    const {id} = request.params;
    const found = getJob(id);
    if (found) {
        reply.send(found);
    } else {
        reply.status(404).send({error: `Job "${id}" not found`});
    }
}