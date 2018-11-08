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

function json2File(jsonObj, fileDir) {
    fs.writeFile(fileDir, JSON.stringify(jsonObj, null, 2), function (err) {
        if (err) {
            console.log(err);
        }
    });
    return fileDir;
}

/**
 *
 * @param {String}mmdString your mermaid string
 * @param {String}chromeDir: chrome binary dir
 * @param {Array<String>}chromeArgs: chrome args, see https://peter.sh/experiments/chromium-command-line-switches/
 * @returns {Promise}
 * @private
 */
function _string2svgAsync(mmdString, chromeDir, chromeArgs) {
    const tmpFile = getTmp();
    return new Promise((resolve, reject) => {
        fs.writeFile(tmpFile, mmdString, function (err) {
            if (err) {
                return console.log(err);
            }
            // see https://github.com/GoogleChrome/puppeteer/blob/v1.8.0/docs/api.md#puppeteerlaunchoptions
            const puppeteerArgs = {
                "headless": true,
                "executablePath": chromeDir
            };
            if (chromeArgs) {
                puppeteerArgs['args'] = chromeArgs;
            }
            // see https://github.com/mermaidjs/mermaid.cli#options
            const args = [
                '-i', tmpFile,
                '-C', path.join(__dirname, 'mermaid.css'),
                '-b', '#ffffff',
                '-p', json2File(puppeteerArgs, tmpFile + ".json")
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
                    fs.unlinkSync(tmpFile + '.json');
                    const img = "<img src='data:image/svg+xml;base64," + new Buffer(text).toString('base64') + "'>";
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
                var chromeDir = this.config.get('pluginsConfig.mermaid-cli.chromeDir');
                var chromeArgs = this.config.get('pluginsConfig.mermaid-cli.chromeArgs');
                var body = block.body;
                var src = block.kwargs.src;
                if (src) {
                    var relativeSrcPath = url.resolve(this.ctx.file.path, src)
                    var absoluteSrcPath = decodeURI(path.resolve(this.book.root, relativeSrcPath))
                    body = fs.readFileSync(absoluteSrcPath, 'utf8')
                }
                return _string2svgAsync(body, chromeDir, chromeArgs);
            }
        }
    }, hooks: {
        // from gitbook-plugin-mermaid-gb3
        'page:before': async function processMermaidBlockList(page, a) {
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