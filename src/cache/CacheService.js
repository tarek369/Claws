const CacheSchema = require('../db/models/cache');

module.exports.saveToCache = async (req, data) => {
    if (data) {
        let link;
        const resultData = {
            title: req.query.title,
            year: req.query.year,
            episode: req.query.episode,
            season: req.query.season,
        }

        if (data.event === 'scrape') {
            link = {
                uri: data.target,
                type: req.query.type,
                resultData,
                metadata: {
                    eventType: 'scrape',
                    provider: data.provider,
                    resolver: data.resolver,
                }
            }
        } else {
            link = {
                uri: data.file.data,
                type: req.query.type,
                resultData,
                metadata: {
                    eventType: 'result',
                    provider: data.metadata.provider,
                    resolver: data.metadata.source,
                    headers: data.metadata.headers,
                }
            }
        }
        const linkExists = CacheSchema.findOne({
            uri: data.link
        }).then(linkExists => {
            return linkExists || CacheSchema.create(link)
        });
    }
}