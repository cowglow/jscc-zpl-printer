import fs from 'fs/promises';
import path from 'path';
import {fileURLToPath} from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

export type Participant = {
    realName: {
        givenName: string;
        familyName: string;
        placeFamilyNameFirst?: boolean;
        hideFamilyNameOnWebsite?: boolean;
    };
    tags: string[];
};

const execAsync = promisify(exec);
function sanitizeJsonContent(content: string): string {
    // Remove comment lines and replace tabs
    const lines = content.split('\n');
    const filteredLines = lines.filter(line => !line.trim().startsWith('//'));
    return filteredLines.join('\n').replace(/\t/g, ' ');
}
export async function loadParticipants(): Promise<Participant[] | number> {
    // // Get the directory path
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(`${__filename}/../../../`);
    const participantsDir = path.resolve(__dirname, '../participants');

    // Read all JSON files from the directory
    const files = await fs.readdir(participantsDir);
    const jsonFiles = files.filter(file => file.endsWith('.json'));
    const jsonFilePaths = jsonFiles.map(file => path.join(participantsDir, file));

    // Use jq to process each file
    return await Promise.all(jsonFilePaths.map(async (file) => {
        // First read and sanitize the file content
        const content = await fs.readFile(file, 'utf-8');
        const sanitizedContent = sanitizeJsonContent(content);

        // Use jq to format the JSON content
        const {stdout} = await execAsync(`echo '${sanitizedContent.replace(/'/g, "'\\''")}' | jq -M '.'`);
        console.log(stdout);
        return JSON.parse(stdout) as Participant;
    }));

}