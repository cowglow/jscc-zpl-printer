import {defineConfig} from "vite";
import {resolve} from "path";
import {fileURLToPath} from "url";

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
    base: "/jscc-zpl-image",
    build: {
        rollupOptions: {
            input: {
                main:   resolve(__dirname, 'index.html'),
                editor: resolve(__dirname, 'editor.html'),
            }
        }
    },
    server: {
        proxy: {
            '/print':        'http://localhost:3001',
            '/participants': 'http://localhost:3001',
            '/test-printer': 'http://localhost:3001',
            '/server-info':  'http://localhost:3001',
            '/print-qr':     'http://localhost:3001',
            '/printers':     'http://localhost:3001',
        }
    }
})