import Fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyStatic from "@fastify/static";
import {fileURLToPath} from "node:url";
import path from "node:path";
import {ROUTES, SERVER_HOST, SERVER_PORT, SERVER_RUNNING_MESSAGE} from "./server/constants.ts";
import {participants} from "./server/api/participants.ts";
import {print} from "./server/api/print.ts";
import {testPrinterConnection} from "./server/api/test-printer.ts";
import {serverInfo} from "./server/api/server-info.ts";
import {printQR} from "./server/api/print-qr.ts";
import {printers} from "./server/api/printers.ts";

const fastify = Fastify({logger: true});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

fastify.register(fastifyStatic, {root: path.join(__dirname, "dist"), prefix: "/jscc-zpl-image/"});
fastify.register(cors, {origin: true});

fastify.get(ROUTES.ROOT, async (_, reply) =>
    reply.sendFile("index.html")
);
fastify.post(ROUTES.PARTICIPANTS, participants);
fastify.post(ROUTES.PRINT, print);
fastify.post(ROUTES.TEST_PRINTER, testPrinterConnection);
fastify.get(ROUTES.SERVER_INFO, serverInfo);
fastify.post(ROUTES.PRINT_QR, printQR);
fastify.get(ROUTES.PRINTERS, printers);

try {
    await fastify.listen({port: SERVER_PORT, host: SERVER_HOST})
    console.info(SERVER_RUNNING_MESSAGE)
} catch (error) {
    fastify.log.error(error)
    process.exit(1)
}
