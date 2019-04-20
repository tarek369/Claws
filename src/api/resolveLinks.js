'use strict';

// Load providers
const { providers } = require('../scrapers/providers');
const { queue } = require('../utils/queue');
const RequestPromise = require('request-promise');

const logger = require('../utils/logger');
const WsWrapper = require('../utils/WsWrapper');
const resolveHtml = require('../scrapers/resolvers/resolveHtml');
const CacheSearchSchema = require('../db/models/cachedSearch');

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
    req.query = data;
    const type = data.type;

    // TODO: Move to Cache service
    const { title, season, episode, year } = req.query;
    let searchTitle = title;
    if (type === 'tv') {
        searchTitle += ` S${season}E${episode}`
    } else {
        searchTitle += ` ${year}`
    }
    const existsInCache = await CacheSearchSchema.findOne({
        searchTitle
    });
    console.log('\n\nExists in Cache : ' + !!existsInCache + '\n\n')

    if (!data.options) {
        data.options = {}
    }
    
    data.options.existsInCache = !!existsInCache

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
    if(existsInCache) {
        logger.debug(`Cache exits for this search and will be used to resolve links`);
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

    // TODO: move to cache service
    if (!existsInCache) {
        await CacheSearchSchema.create({ type, searchTitle })
    }

    if (ws.isAlive) {
        logger.debug('Scraping complete: sending `Done` event');
        ws.send(JSON.stringify({ event: 'done' }));
    } else {
        logger.debug('Scraping complete: `Done` event ready, but websocket is dead.');
    }
};

module.exports = resolveLinks;
