import template from "../templates/about/about-page-template.html?raw";
export function renderAbout() {
    const app = document.querySelector<HTMLDivElement>("#app");
    if (app) {
        app.innerHTML = template;
    }
}
