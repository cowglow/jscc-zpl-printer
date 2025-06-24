import {describe, expect, test} from "vitest";
import {loadParticipants} from "./load-participants.ts";

describe(loadParticipants, () => {
    test("it should load participants from JSON files", async () => {
        const participants = await loadParticipants();
        expect(participants).toBeTruthy();
    })
})