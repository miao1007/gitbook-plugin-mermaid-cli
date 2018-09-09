const childProcess = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const binPath = externalTool("mmdc");
const url = require('url');

function getTmp() {
    const filename = 'foo' + crypto.randomBytes(4).readUInt32LE(0) + 'bar';
    return "/tmp/" + filename;
}

function _string2svgAsync(mmdString) {
    const tmpFile = getTmp();
    return new Promise((resolve, reject) => {
        fs.writeFile(tmpFile, mmdString, function (err) {
            if (err) {
                return console.log(err);
            }
            // see https://github.com/mermaidjs/mermaid.cli#options
            const args = [
                '-i', tmpFile,
                '-C', path.join(__dirname, 'mermaid.css'),
                '-b', '#ffffff'
            ];
            childProcess.execFile(binPath, args, function (err, stdout, stderr) {
                if (err || stderr) {
                    console.log("err=");
                    console.log(stderr);
                    fs.unlinkSync(tmpFile);
                    reject(err || stdout)
                } else {
                    const text = fs.readFileSync(tmpFile + '.svg', 'utf8');
                    fs.unlinkSync(tmpFile);
                    fs.unlinkSync(tmpFile + '.svg');
                    var trim = text.trim();
                    var newPath = "data:image/svg+xml;base64," + new Buffer(trim).toString('base64');
                    var img = "<img src='" + newPath + "'";
                    resolve(img)
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
                const processed = "{% mermaid %}\n" + mermaidContent + "{% endmermaid %}\n"
                page.content = page.content.replace(rawBlock, processed);
            }
            return page;
        }
    }
};

// from https://github.com/raghur/mermaid-filter/blob/master/index.js
function externalTool(command) {
    return (function firstExisting(paths, error) {
        for (var i = 0; i < paths.length; i++) {
            if (fs.existsSync(paths[i])) return `${paths[i]}`;
        }
        error();
    })([
            path.resolve(__dirname, "node_modules", ".bin", command),
            path.resolve(__dirname, "..", ".bin", command)],
        function () {
            console.error("External tool not found: " + command);
            process.exit(1);
        });
}