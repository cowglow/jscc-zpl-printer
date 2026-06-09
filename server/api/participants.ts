import type {FastifyReply, FastifyRequest, RequestGenericInterface} from "fastify";
import {loadParticipants} from "../utils/load-participants.ts";
import {createJSCCLabel} from "../../src/client/templates/create-jscc-label.ts";
import {enqueueJob} from '../printQueue.ts';

type ParticipantRequest = RequestGenericInterface & {
    Body: { sourceDir: string }
}

export async function participants(request: FastifyRequest<ParticipantRequest>, reply: FastifyReply): Promise<void> {
    const {sourceDir} = request.body;
    try {
        const list = await loadParticipants(sourceDir);
        const jobs = list.map(participant => {
            const zpl = createJSCCLabel(participant);
            return enqueueJob(zpl);
        });
        reply.status(202).send({queued: jobs.length, jobIds: jobs.map(j => j.id)});
    } catch (error) {
        reply.status(500).send({error: 'Failed to queue participant labels', details: String(error)});
    }
}