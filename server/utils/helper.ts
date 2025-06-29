import {readdir, readFile} from "fs/promises";
import {join} from "node:path";
import {parse} from 'jsonc-parser';
import {exec} from "child_process";

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

export type LabelData = {
    name: string;
    company: string;
    tags: string[];
}

export async function createParticipantFilePaths(directory: string): Promise<string[]> {
    const participantsDirectory = await readdir(directory, {withFileTypes: true, encoding: 'utf8'});
    const filteredParticipantsDirectory = participantsDirectory.filter((dirent) => dirent.isFile() && dirent.name.endsWith('.json') && !dirent.name.startsWith('_'))
    return filteredParticipantsDirectory.map(({name}) => join(directory, name));
}

export async function parseParticipantJson(filePath: string): Promise<Participant> {
    const text = await readFile(filePath, 'utf-8');
    return parse(text);
}

export function createLabelDataFromParticipant(data: Participant): LabelData {
    return {
        name: `${data.realName.givenName}${!data.realName?.hideFamilyNameOnWebsite ? ` ${data.realName.familyName}` : ""}`,
        company: String(data.company),
        tags: data.tags
    }
}

export function sendZPLToUSBPrinter(printerName: string, zpl: string) {
    return new Promise<void>((resolve, reject) => {
        const cmd = createPrintCommand(zpl, printerName)
        exec(cmd, (error: any, _stdout: string, stderr: string) => {
            if (error || stderr) {
                reject(error || stderr);
            } else {
                resolve();
            }
        });
    });
}

export function createPrintCommand(zpl: string, printerName: string): string {
    // Escape double quotes in ZPL to avoid shell issues
    const safeZPL = zpl.replace(/"/g, '\\"');

    // Check if printerName contains spaces and wrap it in double quotes if necessary
    const formattedPrinterName = printerName.includes(' ') ? `"${printerName}"` : printerName;

    // return `echo "${safeZPL}" | lp --% -d ${formattedPrinterName} -o raw`;

    return `echo "${safeZPL}" | lp -d ${formattedPrinterName} -o raw`;
}
