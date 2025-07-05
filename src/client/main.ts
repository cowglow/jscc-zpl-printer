import "./style.css";
import {renderPrintLabel} from "./routes/print/label.ts";
import {renderAbout} from "./routes/about.ts";
import {renderPrintText} from "./routes/print/text.ts";
import {renderPrintImage} from "./routes/print/image.ts";

const app = document.querySelector<HTMLDivElement>("#app");

const routes: Record<string, () => void> = {
    "/jscc-zpl-printer": renderPrintLabel,
    "/jscc-zpl-printer/about": renderAbout,
    "/jscc-zpl-printer/print/label": renderPrintLabel,
    "/jscc-zpl-printer/print/text/": renderPrintText,
    "/jscc-zpl-printer/print/image/": renderPrintImage,
}

function handleRoute() {
    const path = window.location.pathname;
    const route = routes[path];
    if (route && app) {
        app.innerHTML = ""; // Clear previous content
        route()
    } else if (app) {
        app.innerHTML = "<h1>404 Not Found</h1><p>The page you are looking for does not exist.</p>";
    }
}

function navigateTo(path: string) {
    history.pushState(null, "", path);
    handleRoute()
}

document.addEventListener("click", (event) => {
    const target = event.target as HTMLAnchorElement;
    if (target.matches("[data-link]")) {
        event.preventDefault();
        navigateTo(target.href)
    }
})

window.addEventListener("popstate", handleRoute);

handleRoute();
