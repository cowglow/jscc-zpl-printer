export function renderPrintImage() {
    const app = document.querySelector<HTMLDivElement>("#app");
    if (app) {
        app.innerHTML = "<h1>Print Image</h1><p>Image printing functionality goes here.</p>";
    }
}
