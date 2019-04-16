let mongoose = require('mongoose')
let cacheSearchSchema = new mongoose.Schema({
    type: String,
    searchTitle: String,
    searched: { type: Date, default: Date.now },
    refreshed: { type: Date, default: Date.now },
});

module.exports = mongoose.model('CachedSearch', cacheSearchSchema);
