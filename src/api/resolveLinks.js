'use strict';

// Load providers
const { providers } = require('../scrapers/providers');
const { queue } = require('../utils/queue');
const RequestPromise = require('request-promise');

const logger = require('../utils/logger');
const WsWrapper = require('../utils/WsWrapper');
const resolveHtml = require('../scrapers/resolvers/resolveHtml');
const CacheSearchSchema = require('../db/models/cachedSearch');
const CacheService = require('../cache/CacheService');

/**
 * Sends the current time in milliseconds.
 */
const sendInitialStatus = (ws) => ws.send(JSON.stringify({ data: [`${new Date().getTime()}`], event: 'status' }));

/**
 * Return request handler for certain media types.
 * @param data media query
 * @param ws web socket
 * @param req request
 * @return {Function}
 */
const resolveLinks = async (data, ws, req) => {
    if (!req.query) {
        req.query = data;
    }
    const type = data.type;
    let existsInCache = false;
    
    if (process.env.ENABLE_CACHE === 'true') {
        const cacheService = new CacheService(req);   
        
        if (type !== 'resolveHtml') {
            existsInCache = !!await cacheService.checkExists();
    
            if (!data.options) {
                data.options = {}
            }
    
            data.options.existsInCache = existsInCache;
        }
    }    
    
    const wsWrapper = new WsWrapper(ws, data.options, req);
    ws.on('close', () => {
        wsWrapper.stopExecution = true;
    });

    if (type === 'resolveHtml') {
        try {
            const results = await resolveHtml(data);
            for (const result of results) {
                await wsWrapper.send(result)
            }
        } catch (err) {
            ws.send(`{"event": "result", "error": "${(err.message || err.toString()).substring(0, 100) + '...'}", "isResultOfScrape": true}`);
            logger.error(err);
        } finally {
            ws.send(`{"event": "scrapeEnd", "scrapeId": "${data.scrapeId}"}`);
        }
        return;
    }
    
    sendInitialStatus(ws);
    const promises = [];

    // TODO: also check link refresh to see if cache needs updating
    let availableProviders
    if (process.env.ENABLE_CACHE === 'true' && existsInCache) {
        logger.debug(`Cache exists for this search and will be used to resolve links`);
        availableProviders = [...providers.cache];
    } else {
        availableProviders = [...providers[type], ...providers.universal];
    }

    // Get available providers.
    availableProviders.forEach((provider) => promises.push(provider.resolveRequests(req, wsWrapper)));

    if (queue.isEnabled) {
        queue.process()
    }

    await Promise.all(promises);

    if (ws.isAlive) {
        logger.debug('Scraping complete: sending `Done` event');
        ws.send(JSON.stringify({ event: 'done' }));
    } else {
        logger.debug('Scraping complete: `Done` event ready, but websocket is dead.');
    }
};

module.exports = resolveLinks;
