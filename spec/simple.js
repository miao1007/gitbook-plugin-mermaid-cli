var test = require("../index")
async function _call() {
    const data = "graph TD\n" +
        "A[Christmas] -->|Get money| B(Go shopping)\n" +
        "B --> C{Let me think}\n" +
        "C -->|One| D[Laptop]\n" +
        "C -->|Two| E[iPhone]\n" +
        "C -->|Three| F[Car]";
    const svg = await test.string2svgAsync(data)
    console.log(svg);
}
_call();