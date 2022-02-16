const mockedData = require("./data/telia-glossary.json");
var http = require('http');


http.createServer(function (request, response) {
    response.setHeader('Content-Type', 'application/json');
    response.end(mockedData);
 }).listen(8081);
 
 // Console will print the message
 console.log('Server running at http://127.0.0.1:8081/');