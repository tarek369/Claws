'use strict';

// Import dependencies
const express = require('express');
const logger = require('./src/utils/logger');

// Load and define application data
const pkg = require('./package.json');
require('dotenv').config();
const pathToApp = __dirname;

// Initialize express
let app = express();

// Add renderer.
app.engine('html', require('ejs').__express);
app.set('views', 'public'); // render from the public directory.
app.set('view engine', 'html');

// Load external ExpressJS middleware
const compression = require('compression');

app.use(require('body-parser').json({limit: '10mb'}));
app.use(compression({filter: (req, res) => {
    if (req.headers['x-no-compression'] || req.headers['accept'] === 'text/event-stream') {
        // don't compress responses with this request header
        return false;
    }

    // fallback to standard filter function
    return compression.filter(req, res)
}}));

// Middleware: Initialise logging.
app.use(require('morgan')('combined', {stream: logger.stream}));

// Middlware: Add headers to API.
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "origin, X-Requested-With, Content-Type, Accept");
    next();
});


/** RENDERED ROUTES **/
app.get('/', function(req, res) {
    if (process.env.NODE_ENV === 'production') {
        // When in production, redirect to the main site.
        res.redirect("https://apollotv.xyz/");
    } else {
        // Otherwise, render the index file with the secret client id set.
        res.render('index', {secret_client_id: process.env.SECRET_CLIENT_ID});
    }
});
app.get('/salsa20.min.js', (req, res) => res.sendFile(`${pathToApp}/public/salsa20.min.js`));
/** ./RENDERED ROUTES **/


/** API ROUTES **/
const generalRoutes = require('./src/api/generalRoutes');
app.use('/api/v1', generalRoutes);

const authRoutes = require('./src/api/authRoutes');
app.use('/api/v1', authRoutes);

const resolveRoutes = require('./src/api/resolveRoutes');
app.use('/api/v1/resolve', resolveRoutes);
/** ./API ROUTES **/

const http = require('http');
const WebSocket = require('ws');
const URL = require('url');
const {verifyToken} = require('./src/utils');
const resolveLinks = require('./src/api/resolveLinks');

//initialize a simple http server
const server = http.createServer(app);

//initialize the WebSocket server instance
const wss = new WebSocket.Server({server});

wss.on('connection', async (ws, req) => {
    const token = URL.parse(req.url, true).query.token;
    const {auth, message} = await verifyToken(token);

    if (!auth) {
        ws.send(message, undefined, () => ws.terminate());
    }

    ws.isAlive = true;

    ws.on('pong', () => {
        ws.isAlive = true;
    });

    //connection is up, let's add a simple simple event
    ws.on('message', (message) => {
        let data;
        try {
            data = JSON.parse(message);
            console.log(data)
        } catch (err) {
            console.error(err);
            ws.send(`{"message": "That was not a JSON object..."}`);
        }

        resolveLinks(data, ws, req);
    });
});

setInterval(() => {
    wss.clients.forEach((ws) => {

        if (!ws.isAlive) {
            return ws.terminate();
        }

        ws.isAlive = false;
        try {
            ws.ping(null, false, true);
        } catch (err) {
            console.log("WS client disconnected, can't ping");
            ws.terminate();
        }
    });
}, 10000);

// Start listening...
server.listen(process.env.PORT, () => {
    console.log(`${pkg.name} v${pkg.version} server listening on: http://127.0.0.1:${process.env.PORT}`);
});