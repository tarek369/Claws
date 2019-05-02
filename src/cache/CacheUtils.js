const uuid = require('uuid/v4');
const logger = require('../utils/logger');

module.exports.formatSave = (searchData, data) => {
    if (data.event === 'scrape' || data.event === 'RDScrape') {
        return {
            event: 'scrape',
            uri: data.target,
            type: searchData.type,
            searchData,
            eventData: {
                provider: data.provider,
                resolver: data.resolver,
                target: data.target,
                cookieRequired: data.cookieRequired,
                quality: data.quality,
                isRDScrape: data.options.hasRD
            }
        }
    } else {
        return {
            event: 'result',
            uri: data.file.data,
            type: searchData.type,
            searchData,
            eventData: {
                file: {
                    data: data.file.data
                },
                isResultOfScrape: data.isResultOfScrape,
                metadata: {
                    provider: data.metadata.provider,
                    source: data.metadata.source,
                    headers: data.metadata.headers,
                    quality: data.metadata.quality
                }
            }
        }
    }
}

module.exports.resolveCachedLink = async(cacheData, ws, metadata) => {
    delete cacheData.eventData.$init;
    if (cacheData.event === 'scrape') {
        delete cacheData.eventData.metadata;
        delete cacheData.eventData.file;

        if (cacheData.eventData.isRDScrape && metadata.hasRD) {
            cacheData.event = 'RDScrape'
            cacheData.eventData = {
                event: 'RDScrape',
                target: cacheData.eventData.target,
                provider: cacheData.eventData.provider,
                resolver: cacheData.eventData.resolver,
                quality: cacheData.eventData.quality
            }
        } else {
            cacheData.eventData.scrapeId = uuid();
        }
    }
    await ws.send({event: cacheData.event, ...cacheData.eventData});
}