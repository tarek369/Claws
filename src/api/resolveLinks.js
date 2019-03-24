'use strict';

// Load providers
const providers = require('../scrapers/providers');

const logger = require('../utils/logger');
const WsWrapper = require('../utils/WsWrapper');

/**
 * Sends the current time in milliseconds.
 */
const sendInitialStatus = (ws) => ws.send(JSON.stringify({data: [`${new Date().getTime()}`], event: 'status'}));

/**
 * Return request handler for certain media types.
 * @param data media query
 * @param ws web socket
 * @param req request
 * @return {Function}
 */
const resolveLinks = async (data, ws, req) => {
    const type = data.type;

    sendInitialStatus(ws);

    const wsWrapper = new WsWrapper(ws, data.options);

    ws.on('close', () => {
        wsWrapper.stopExecution = true;
    });

    const promises = [];

    req.query = data;

    // Get available providers.
    let availableProviders = [...providers[type], ...providers.universal];

    availableProviders.forEach((provider) => promises.push(provider.resolveRequests(req, wsWrapper)));

    await Promise.all(promises);

    if (ws.isAlive) {
        ws.send(JSON.stringify({event: 'done'}));
    } else {
        logger.debug('done event not sent since the websocket is dead.')
    }
};

module.exports = resolveLinks;
