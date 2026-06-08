export {JSCC_YEAR} from '../src/shared/constants.ts';
export const SERVER_PORT = Number(process.env.PORT) || 3000;
export const SERVER_HOST = "0.0.0.0"
export const SERVER_URL = `http://${SERVER_HOST}:${SERVER_PORT}`;
export const SERVER_RUNNING_MESSAGE = `🚀 Fastify server started on ${SERVER_URL}`
export const ROUTES = {
    PRINT: '/print',
    PARTICIPANTS: '/participants',
    TEST_PRINTER: '/test-printer',
    SERVER_INFO: '/server-info',
    PRINT_QR: '/print-qr',
    ROOT: '/',
}
