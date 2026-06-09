import {defineConfig} from "vite";
import {resolve} from "node:path";

export default defineConfig({
    base: "/jscc-zpl-image",
    build: {
        rollupOptions: {
            input: {
                main:    resolve(__dirname, "index.html"),
                sticker: resolve(__dirname, "sticker.html"),
            }
        }
    },
    server: {
        proxy: {
            '/print':       'http://localhost:3001',
            '/participants':'http://localhost:3001',
            '/test-printer':'http://localhost:3001',
            '/server-info': 'http://localhost:3001',
            '/print-qr':    'http://localhost:3001',
            '/printers':    'http://localhost:3001',
            '/status':      'http://localhost:3001',
            '/jobs':        'http://localhost:3001',
        }
    }
})