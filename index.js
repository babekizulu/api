/*
*Primary file for the API
*
*/

//Dependencies 
const http = require('http');
const url = require('url');

//The server should respond to all requests with a string
const server = http.createServer((req, res) => {
    //Get the requested url and parse it
    const parsedURL = url.parse(req.url, true);

    //Get the path from the requested URL
    const path = parsedURL.pathname;
    const trimmedPath = path.replace(/^\/+|\/+$/g, '');

    //Get the http method
    const method = req.method.toLowerCase();

    //Send the response
    res.end(`Hey y'all`)

    //Log what path the user asked for
    console.log(`Request received on this path: ${trimmedPath}, with this method: ${method}`);
})

//Start server and listen on port 3000
server.listen(3000, () => {
    console.log('The server is listening on port: 3000');
})