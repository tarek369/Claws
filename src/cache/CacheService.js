const CacheSchema = require('../db/models/cache');
const CacheSearchSchema = require('../db/models/cachedSearch');
const {formatSave} = require('./CacheUtils');
const logger = require('../utils/logger');
const CacheService = class CacheService {
    constructor(req) {
        this.req = req;
    }

    async save(data) {
        if (data) {
            let linkData;
            const searchData = {
                title: this.req.query.title,
                type: this.req.query.type,
                year: this.req.query.year,
                episode: this.req.query.episode,
                season: this.req.query.season,
            }

            linkData = formatSave(searchData, data);

            const linkExists = CacheSchema.findOne({
                uri: data.file ? data.file.data : data.target
            }).then(linkExists => {
                return linkExists || CacheSchema.create(linkData)
            });
        }
    }

    async checkExists() {
        const { title, season, episode, year, type } = this.req.query;
        let searchTitle = title;
        if (type === 'tv') {
            searchTitle += ` S${season}E${episode}`
        } else {
            searchTitle += ` ${year}`
        }
        const existsInCache = await CacheSearchSchema.findOne({
            searchTitle
        });
        logger.debug(`${searchTitle} ${!!existsInCache ? 'exists' : 'does not exist'} in Cache`);
        
        if (!existsInCache) {
            await CacheSearchSchema.create({ type, searchTitle })
        }
        
        return existsInCache;
    }
}

module.exports = CacheService;
