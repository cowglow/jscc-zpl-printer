export function renderPrintText() {
    const app = document.querySelector<HTMLDivElement>("#app");
    if (app) {
        app.innerHTML = "<h1>Print Text</h1><p>Text printing functionality goes here.</p>";
    }
}