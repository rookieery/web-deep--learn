const http = require('http');

http.createServer((request, response) => {
    let body = [];
    request.on('error', (err) => {
        console.error(err);
    }).on('data', (chunk) => {
        console.log(chunk);
        body.push(chunk);
    }).on('end', () => {
        body = Buffer.concat(body).toString();
        console.log('body:', body);
        response.writeHead(200, { 'Content-type': 'text/html' });
        response.end(
`<html maaa=a >
<head class="my-head">
    <style>
#container {
    width:500px;
    height:300px;
    display:flex;
    flex-wrap: wrap;
    justify-content: space-around;
    align-items: center;
    background-color:rgb(255,255,255);
}
#container #my-id {
    width:200px;
    height:100px;
    background-color:rgb(255,0,0);
}
#container .c1 {
    width: 400px;
    height: 100px;
    background-color:rgb(0,255,0);
}
    </style>
</head>
<body>
    <div id="container">
       <div id="my-id"></div>
       <div class="c1" ></div>
    </div>
</body>
</html>`
        );
    });
}).listen(8088);

console.log('server started');

// `<html maaa=a >
// <head class="my-head">
//     <style>
// body div #myid{
//     width:100px;
//     background-color: #ff5000;
// }
// body div img{
//     width:30px;
//     background-color: #ff1111;
// }
// .my-div .s1{
//     width:10px;
//     height:20px;
//     display:flex;
// }
// .my-div .s2{
//     color: #1F6666;
// }
//     </style>
// </head>
// <body>
//     <div class="my-div">
//         <img id="myid"/>
//         <img />
//         <span class="s1 s2">Hello World!</span>
//     </div>
// </body>
// </html>`