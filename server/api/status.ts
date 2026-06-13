import type {FastifyReply, FastifyRequest} from 'fastify';
import {getStatus} from '../printQueue.ts';

export async function status(_request: FastifyRequest, reply: FastifyReply) {
    reply.send(getStatus());
}