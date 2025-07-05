import template from "../../templates/print/label-form-template.html?raw";
export function renderPrintLabel() {
    const app = document.querySelector<HTMLDivElement>("#app");
    if (app) {
        app.innerHTML = template
    }
}
