const BaseResolver = require('./_BaseResolver');

const cheerio = require('cheerio');
const vm = require('vm');

module.exports = class StreamLewd extends BaseResolver {

    /** @inheritdoc */
    supportsUri(uri) {
        return uri.includes('stream.lewd.host/embed');
    }

    /** @inheritdoc */
    resolveHtml(meta, html, jar, headers) {
        let $ = cheerio.load(html);
        let script = $('script').last()[0].children[0].data;
        // Decode and eval the script.
        script = script.replace('JuicyCodes.Run', 'eval(atob').replace(');', '));');

        let jwPlayerConfig;
        let jQuery = this._getJqueryShim($);
        const sandbox = this._getDefaultSandbox(jQuery, this._getJwPlayerShim((config) => {
            jwPlayerConfig = config;
        }));

        vm.createContext(sandbox); // Contextify the sandbox.
        vm.runInContext(script, sandbox);

        let links = this._resolveJwPlayerLinks(jwPlayerConfig, meta);

        return this.processHtmlResults(meta, links);
    }
};