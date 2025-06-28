import {
    createLabelDataFromParticipant,
    createParticipantFilePaths,
    parseParticipantJson,
    type Participant
} from "./helper.ts";

export async function loadParticipants(directory: string) {
    const filePaths = await createParticipantFilePaths(directory);
    const participantResults = await Promise.allSettled(filePaths.map(parseParticipantJson));
    const participantValues = participantResults.map((result) => {
        try {
            if (result.status === 'fulfilled') return result.value;
        } catch (error) {
            console.error(`Error parsing participant file: ${error}`);
        }
    })
    const filteredParticipantValues = participantValues.filter((item): item is Participant => item !== undefined);
    return filteredParticipantValues.map(createLabelDataFromParticipant);
}
