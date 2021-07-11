const http = require('http');
const fs = require('fs');
const archiver = require('archiver');

const request = http.request({
    hostname: '127.0.0.1',
    port: 8082,
    method: "POST",
    headers: {
        'Content-Type': 'application-stream'
    }
}, response => {
    console.log(response);
});

// const file = fs.createReadStream('./sample');
// file.pipe(request);
// file.on('end', () => request.end());

const archive = archiver('zip', {
    zlib: { level: 9 }
});
archive.directory('./sample/', false);
archive.finalize();
archive.pipe(request);
// archive.pipe(fs.createWriteStream('tmp.zip'));

// file.on('data', chunk => {
//     console.log(chunk.toString());
//     request.write(chunk);
// })

// file.on('end', chunk => {
//     console.log("read finished");
//     request.end(chunk);
// })