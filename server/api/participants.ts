import type {FastifyReply, FastifyRequest, RequestGenericInterface} from "fastify";
import {loadParticipants} from "../utils/load-participants.ts";
import {createJSCCLabel} from "../../src/client/templates/create-jscc-label.ts";
import {sendZPLToUSBPrinter} from "../utils/helper.ts";

type ParticipantRequest = RequestGenericInterface & {
    Body: {
        printerName: string
        sourceDir: string
    }
}

export async function participants(request: FastifyRequest<ParticipantRequest>, reply: FastifyReply): Promise<void> {
    const {printerName, sourceDir} = request.body;
    try {
        const participants = await loadParticipants(sourceDir);
        for (const participant of participants) {
            const zpl = createJSCCLabel(participant);
            await sendZPLToUSBPrinter(printerName, zpl);
        }
        reply.send({status: 'Printing participants labels for #JSCC25'});
    } catch (error) {
        reply.status(500).send({error: 'Failed to print participants data', details: String(error)});
    }
}
