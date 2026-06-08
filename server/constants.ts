export const SERVER_PORT = Number(process.env.PORT) || 3001;
export const JSCC_YEAR = 26;
export const SERVER_HOST = "localhost"
export const SERVER_URL = `http://${SERVER_HOST}:${SERVER_PORT}`;
export const SERVER_RUNNING_MESSAGE = `🚀 Fastify server started on ${SERVER_URL}`
export const ROUTES = {
    PRINT: '/print',
    PARTICIPANTS: '/participants',
    TEST_PRINTER: '/test-printer',
    SERVER_INFO: '/server-info',
    ROOT: '/',
}
