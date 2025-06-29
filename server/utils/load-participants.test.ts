import {describe, expect, test} from "vitest";
import {loadParticipants} from "./load-participants.ts";

const mockJoernParticipant = {
    name: "Jörn",
    company: "compose.us GmbH",
    tags: ["Svelte", "TypeScript", "CSS", "WebRTC"],
}

const mockPhilipSaaParticipant = {
    name: "Philip Saa",
    company: "Saab Deutschland GmbH",
    tags: ["Indie Web", "A/V", "React", "Svelte", "TypeScript", "Playwright"],
};

describe(loadParticipants, () => {
    test("it should load participants from JSON files", async () => {
        const participants = await loadParticipants("sourceDir");
        expect(participants).toEqual([
            mockJoernParticipant,
            mockPhilipSaaParticipant
        ]);
    })
})
