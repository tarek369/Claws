let mongoose = require('mongoose')
let cacheSchema = new mongoose.Schema({
    uri: String,
    type: String,
    resultData: {
        title: String,
        season: String,
        episode: String,
        year: String,
    },
    metadata: {
        eventType: String,
        provider: String,
        resolver: String,
        quality: String,
        headers: {},
        ttl: { type: Date, default: Date.now, expires: 24 * 3600 * 30 }, // 24hrs * 3600s (1hr) * 30 (days) = 2592000s
        searched: { type: Date, default: Date.now },
    }
})

module.exports = mongoose.model('Cache', cacheSchema);