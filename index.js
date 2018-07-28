const childProcess = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const binPath = path.join(__dirname, "../.bin/mmdc");
const url = require('url');

function _string2svgAsync(mmdString) {
    const filename = 'foo' + crypto.randomBytes(4).readUInt32LE(0) + 'bar';
    const tmpFile = "/tmp/" + filename;
    return new Promise((resolve, reject) => {
        fs.writeFile(tmpFile, mmdString, function (err) {
            if (err) {
                return console.log(err);
            }
            console.log("tmpFile =" + tmpFile);
            childProcess.execFile(binPath, ['-i', tmpFile], function (err, stdout, stderr) {
                if (err || stderr) {
                    console.log("err=");
                    console.log(err || stderr);
                    fs.unlinkSync(tmpFile);
                    reject(err || stderr)
                } else {
                    const text = fs.readFileSync(tmpFile + '.svg', 'utf8');
                    fs.unlinkSync(tmpFile);
                    fs.unlinkSync(tmpFile + '.svg');
                    var trim = text.trim();
                    resolve("\n<!--mermaid-->\n<div>\n" + trim + "\n</div>\n<!--endmermaid-->\n\n")
                }
            });
        });
    })
}

module.exports = {
    string2svgAsync: _string2svgAsync,
    blocks: {
        mermaid: {
            process: function (block) {
                var body = block.body;
                var src = block.kwargs.src;
                if (src) {
                    var relativeSrcPath = url.resolve(this.ctx.file.path, src)
                    var absoluteSrcPath = decodeURI(path.resolve(this.book.root, relativeSrcPath))
                    body = fs.readFileSync(absoluteSrcPath, 'utf8')
                }
                return _string2svgAsync(body);
            }
        }
    }, hooks: {
        // from gitbook-plugin-mermaid-gb3
        'page:before': async function processMermaidBlockList(page) {
            const mermaidRegex = /^```mermaid((.*[\r\n]+)+?)?```$/im;
            var match;
            while ((match = mermaidRegex.exec(page.content))) {
                var rawBlock = match[0];
                var mermaidContent = match[1];
                const processed =  "{% mermaid %}\n" +mermaidContent  + "{% endmermaid %}\n"
                page.content = page.content.replace(rawBlock, processed);
            }
            return page;
        }
    }
};