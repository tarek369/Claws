const BaseProvider = require('../BaseProvider');

module.exports = class DebugDummy extends BaseProvider {
    /** @inheritdoc */
    getUrls() {
        return [''];
    }

    /** @inheritdoc */
    async scrape(url, req, ws) {
        const resolvePromises = [];
        const debugLinks = [
            // Hardcoded Links
        ];
        for (const debugLink of debugLinks) {
            resolvePromises.push(this.resolveLink(debugLink, ws, null, null));
        }
        return Promise.all(resolvePromises)
    }
}