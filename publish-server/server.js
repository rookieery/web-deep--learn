const http = require('http');
// const fs = require('fs');
const unzipper = require('unzipper');

http.createServer(function (request, response) {
    request.pipe(unzipper.Extract({ path: '../server/public' }));
    // const outFile = fs.createWriteStream('../server/public/tmp.zip');
    // request.pipe(outFile);
    // request.on('data', chunk => {
    //     outFile.write(chunk);
    // })
    // request.on('end', () => {
    //     outFile.end();
    //     response.end('success!');
    // })
}).listen(8082);