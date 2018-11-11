const childProcess = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const binPath = externalTool("mmdc");
const url = require('url');

function getTmp() {
    const filename = 'mermaid' + crypto.randomBytes(4).readUInt32LE(0);
    return path.join(os.tmpdir(), filename);
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
 * @param book: Global book
 * @param svgFileDir: svgFileDir path
 * @returns {string}
 */
function svg2img(book, svgFileDir) {
    return new Promise((resolve, reject) => {
        if (book.generator === 'ebook') {
            // relevant path
            var dest = path.basename(svgFileDir);
            // Copy a file to the output folder
            book.output.copyFile(svgFileDir, dest).then(function () {
                resolve("<img src=\"" + dest + "\"/>");
            });
        } else {
            const text = fs.readFileSync(svgFileDir, 'utf8');
            resolve("<img src='data:image/svg+xml;base64," + new Buffer(text.trim()).toString('base64') + "'>");
        }
    })
}

/**
 *
 * @param {String}mmdString your mermaid string
 * @param book: book
 * @param {String}chromeDir: chrome binary dir
 * @param {Array<String>}chromeArgs: chrome args, see https://peter.sh/experiments/chromium-command-line-switches/
 * @returns {Promise}
 * @private
 */
function _string2svgAsync(mmdString, book, chromeDir, chromeArgs) {
    const strFile = getTmp();
    return new Promise((resolve, reject) => {
        fs.writeFile(strFile, mmdString, function (err) {
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
                '-i', strFile,
                '-C', path.join(__dirname, 'mermaid.css'),
                '-b', '#ffffff',
                '-p', json2File(puppeteerArgs, strFile + ".json")
            ];
            childProcess.execFile(binPath, args, function (err, stdout, stderr) {
                if (err || stderr) {
                    console.log("err=");
                    console.log(stderr);
                    fs.unlinkSync(strFile);
                    reject(err || stdout)
                } else {
                    var svgFile = strFile + '.svg';
                    svg2img(book, svgFile).then(function (img) {
                        fs.unlinkSync(strFile);
                        fs.unlinkSync(strFile + '.json');
                        fs.unlinkSync(svgFile);
                        resolve(img)
                    });
                }
            });
        });
    })
}

module.exports = {
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
                return _string2svgAsync(body, this, chromeDir, chromeArgs);
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