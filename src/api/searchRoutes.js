'use strict';

// Import dependencies
const SSE = require('express-sse');
const {verifyToken} = require('../utils');
const EventEmitter = require('events');

// Load providers
const providers = require('../scrapers/providers');
const BaseProvider = require('../scrapers/providers/BaseProvider');

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

        req.query.type = type;

        // Get available providers.
        [...providers[type], ...providers.universal].forEach((provider) => {
            if(provider instanceof BaseProvider) {
                // Use object orientated provider.
                return promises.push(provider.resolveRequests(req, sse));
            } else {
                // Use declarative provider.
                return promises.push(provider(req, sse));
            }
        });

        req.on('close', function() {
            console.log('disconnected');
            sse.emitter.emit('disconnected');
        });

        sse.emitter.on('disconnected', () => {
			// Stop sending events to the client.
            sse.stopExecution = true;
		    res.end();
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