import {defineConfig} from "vite";

export default defineConfig({
    base: "/jscc-zpl-image",
    server: {
        proxy: {
            '/print': 'http://localhost:3001',
            '/participants': 'http://localhost:3001',
            '/test-printer': 'http://localhost:3001',
            '/server-info': 'http://localhost:3001',
            '/print-qr': 'http://localhost:3001',
            '/printers': 'http://localhost:3001',
        }
    }
})