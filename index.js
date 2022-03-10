/*
*Primary file for the API
*
*/

//Dependencies 
const http = require('http');
const https = require('https');
const url = require('url');
const fs = require('fs');
const StringDecoder = require('string_decoder').StringDecoder;
const config = require('./config');
const {httpPort, httpsPort, envName} = config;

//Instantiate the http server
const httpServer = http.createServer((req, res) => {
    unifiedServer(req, res);
});

//Start the http server
httpServer.listen(httpPort, () => {
    console.log(`The server is listening on port ${httpPort} in ${envName} mode`);
});

//Instantiate the https server
const httpsServerOptions = {
    'key' : fs.readFileSync('./https/key.pem'),
    'cert' : fs.readFileSync('./https/cert.pem')
};
const httpsServer = https.createServer(httpsServerOptions, (req, res) => {
    unifiedServer(req, res)
});

//Start the https 
httpsServer.listen(httpsPort, () => {
    console.log(`The server is listening on port ${httpsPort} in ${envName} mode`);
});

//Reusable server logic for both the HTTP & HTTPS Servers
const unifiedServer = (req, res) => {
    //Get the requested url and parse it
    const parsedURL = url.parse(req.url, true);

    //Get the path from the requested URL
    const path = parsedURL.pathname;
    const trimmedPath = path.replace(/^\/+|\/+$/g, '');

    //Get the query string as an object
    const queryStringObject = parsedURL.query;

    //Get the http method
    const method = req.method.toLowerCase();

    //Get the headers as an object
    const headers = req.headers;

    //Get the payload if there's a payload
    const decoder = new StringDecoder('utf-8');
    let buffer = '';
    req.on('data', data => {
        buffer += decoder.write(data);
    });

    req.on('end', () => {
        buffer += decoder.end();

        //Choose the handler this request should go to
        //Choose 404 Not Found handler if no handler is matched to the request
        const chosenHandler = typeof(router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : handlers.notFound;

        //Construct the data object to send to the handler
        const data = {
            'trimmedPath' : trimmedPath,
            'queryStringObject' : queryStringObject,
            'method' : method,
            'headers' : headers,
            'payload' : buffer
        };

        //Route the request to the handler specified in the Router
        chosenHandler(data, function(statusCode, payload) {
            //Use the status code called back by the handler, or default to 200 
            statusCode = typeof(statusCode) == 'number' ? statusCode : 200;

            //Use the payload called back by the the handler, or default to '{}'
            payload = typeof(payload) == 'object' ? payload : {};

            //Convert the payload object into a string
            const payloadString = JSON.stringify(payload);

            //Return the response
            res.setHeader('Content-Type', 'application/json');
            res.writeHead(statusCode);
            res.end(payloadString);

            //Log what path the user asked for
            console.log(`Returning this response: ${statusCode}, ${payloadString}`);
        });  
    });
}

//Define handlers 
const handlers = {};

//Ping Handler
handlers.ping = (data, callback) => {
    callback(200);
}

//Not found handler
handlers.notFound = (data, callback) => {
    callback(404);
};

//Define a request router
const router = {
    'ping' : handlers.ping
};
