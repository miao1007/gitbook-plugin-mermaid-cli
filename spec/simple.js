var test= require("../index")
const data = "graph TD\n" +
    "A[Christmas] -->|Get money| B(Go shopping)\n" +
    "B --> C{Let me think}\n" +
    "C -->|One| D[Laptop]\n" +
    "C -->|Two| E[iPhone]\n" +
    "C -->|Three| F[Car]";

const svg = test.string2svgSync(data)
console.log(svg);