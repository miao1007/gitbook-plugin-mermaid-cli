const childProcess = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const Q = require('q');

const binPath = path.join(__dirname, "../.bin/mmdc");
function _string2svgSync(mmdString) {
    const deferred = Q.defer();
    const filename = 'foo' + crypto.randomBytes(4).readUInt32LE(0) + 'bar';
    const tmpFile = "/tmp/" + filename;
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
                deferred.reject(err || stderr)
            } else {
                console.log(stdout);
                const text = fs.readFileSync(tmpFile + '.svg', 'utf8');
                fs.unlinkSync(tmpFile);
                fs.unlinkSync(tmpFile + '.svg');
                deferred.resolve(text)
            }
        });
    });
    return deferred.promise;
}

module.exports = {
    string2svgSync: _string2svgSync,
    blocks: {
        mermaid: {
            process: function (block) {
                var body = block.body;
                var src = block.kwargs.src;
                if (src) {
                    var relativeSrcPath = url.resolve(this.ctx.file.path, src)
                    var absoluteSrcPath = decodeURI(path.resolve(this.book.root, relativeSrcPath))
                    body = readFileSync(absoluteSrcPath, 'utf8')
                }
                return _string2svgSync(body);
            }
        }
    }
};