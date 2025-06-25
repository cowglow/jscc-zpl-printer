import {readdir, readFile} from "fs/promises";
import {join} from "node:path";
import {parse} from 'jsonc-parser';

export type Participant = {
    realName: {
        givenName: string;
        familyName: string;
        placeFamilyNameFirst?: boolean;
        hideFamilyNameOnWebsite?: boolean;
    };
    company: string;
    tags: string[];
};

export async function createParticipantFilePaths(directory: string): Promise<string[]> {
    const participantsDirectory = await readdir(directory, {withFileTypes: true, encoding: 'utf8'});
    const filteredParticipantsDirectory = participantsDirectory.filter((dirent) => dirent.isFile() && dirent.name.endsWith('.json') && !dirent.name.startsWith('_'))
    return filteredParticipantsDirectory.map(({name}) => join(directory, name));
}

export async function parseParticipantJson(filePath: string): Promise<Participant> {
    const text = await readFile(filePath, 'utf-8');
    return parse(text);
}

export function createLabelDataFromParticipant(data: Participant) {
    return {
        name: `${data.realName.givenName}${!data.realName?.hideFamilyNameOnWebsite ? ` ${data.realName.familyName}` : ""}`,
        company: String(data.company),
        tags: data.tags
    }
}
