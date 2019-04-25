const uuid = require('uuid/v4');
const logger = require('../utils/logger');

module.exports.formatSave = (searchData, data) => {
    if (data.event === 'scrape') {
        return {
            event: 'scrape',
            uri: data.target,
            type: searchData.type,
            searchData,
            eventData: {
                provider: data.provider,
                resolver: data.resolver,
                target: data.target,
                cookieRequired: data.cookieRequired
            }
        }
    } else if (data.event === 'RDScrape') {
        return {
            event: 'RDScrape',
            uri: data.target,
            type: searchData.type,
            searchData,
            eventData: {
                provider: data.provider,
                resolver: data.resolver,
                target: data.target,
                quality: data.quality
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
        cacheData.eventData.scrapeId = uuid();
        delete cacheData.eventData.file;
        delete cacheData.eventData.metadata;
    }
    await ws.send({event: cacheData.event, ...cacheData.eventData});
}