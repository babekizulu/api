/*
*Primary file for the API
*
*/

//Dependencies 
const http = require('http');
const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;

//The server should respond to all requests with a string
const server = http.createServer((req, res) => {
    //Get the requested url and parse it
    const parsedURL = url.parse(req.url, true);

    //Get the path from the requested URL
    const path = parsedURL.pathname;
    const trimmedPath = path.replace(/^\/+|\/+$/g, '');

    //Get the query string as an object
    const queryStringObject = JSON.stringify(parsedURL.query);

    //Get the http method
    const method = req.method.toLowerCase();

    //Get the headers as an object
    const headers = JSON.stringify(req.headers);

    //Get the payload if there's a payload
    const decoder = new StringDecoder('utf-8');
    let buffer = '';
    req.on('data', data => {
        buffer += decoder.write(data);
    })

    req.on('end', () => {
        buffer += decoder.end();

        //Send the response
        res.end(`Hey y'all`);

        //Log what path the user asked for
        console.log(`Request was received with this payload: ${buffer}`);
    })
})

//Start server and listen on port 3000
server.listen(3000, () => {
    console.log('The server is listening on port: 3000');
})