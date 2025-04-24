import './style.css'

// @ts-ignore
import {Label, PrintDensity, PrintDensityName, Spacing, Text, FontFamily, FontFamilyName} from "jszpl"

const zplTextField = document.querySelector("textarea#zpl-to-print")!
const convertTxtToZPL = (event: Event) => {
    event.preventDefault()
    const form = event.target as HTMLFormElement
    const formData = new FormData(form)
    const data = Object.fromEntries(formData.entries())

    const label = new Label()
    label.printDensity = new PrintDensity(PrintDensityName['8dpmm']);
    label.width = 100;
    label.height = 50;
    label.padding = new Spacing(10);

    const text = new Text();
    label.content.push(text);
    text.fontFamily = new FontFamily(FontFamilyName.D);
    text.text = data.text;
    zplTextField.innerHTML = label.generateZPL();
}

document.querySelector<HTMLFormElement>("form#input-text")!
    .addEventListener("submit", convertTxtToZPL)
document.querySelector<HTMLFormElement>("form#input-text")!
    .addEventListener("reset", () => {
        zplTextField.innerHTML = ""
    })
/*document.querySelector<HTMLDivElement>('#app')!.innerHTML = `

`*/

// setupCounter(document.querySelector<HTMLButtonElement>('#counter')!)
