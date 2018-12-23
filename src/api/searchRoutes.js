'use strict';

// Import dependencies
const SSE = require('express-sse');
const {verifyToken} = require('../utils');
const EventEmitter = require('events');

// Load providers
const providers = require('../scrapers/providers');

// Declare new router and start defining routes:
const searchRoutes = require('express').Router();

/**
 * Sends the current time in milliseconds.
 */
const sendInitialStatus = (sse) => sse.send({ data: [`${new Date().getTime()}`], event: 'status'}, 'result');

/**
 * Return request handler for certain media types.
 * @param {String} type media type
 * @return {Function}
 */
const resolveLinks = (type) => {
    return async (req, res) => {
        const sse = new SSE();
        sse.init(req, res);
        sendInitialStatus(sse);

        sse.emitter = new EventEmitter();

        const promises = [];

        // Get available providers.
        [...providers[type], ...providers.universal].forEach(provider => promises.push(provider(req, sse)));

        req.on('close', function() {
            console.log('disconnected');
            sse.emitter.emit('disconnected');
        });

        sse.emitter.on('disconnected', () => {
            sse.stopExecution = true;
        });

        await Promise.all(promises);
        sse.send({event: 'done'}, 'done');

        // Stop sending events to the client.
        res.end();
    }
};

/**
 * /api/v1/search/movies
 * ------
 * Allows you to search for movies.
 */
searchRoutes.get('/movies', verifyToken, resolveLinks('movies'));

/**
 * /api/v1/search/tv
 * ------
 * Allows you to search for TV shows.
 */
searchRoutes.get('/tv', verifyToken, resolveLinks('tv'));

module.exports = searchRoutes;