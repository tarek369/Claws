const BaseResolver = require('./_BaseResolver');

const cheerio = require('cheerio');
const vm = require('vm');

const urlRegex = /(https?:\/\/(?:www.)?mp4upload.com)\/(?:embed-)?([0-9a-zA-Z.]+?)(\.html)?$/;

module.exports = class Mp4Upload extends BaseResolver {

    /** @inheritdoc */
    supportsUri(uri) {
        return uri.includes('mp4upload.com') && urlRegex.test(uri);
    }

    /** @inheritdoc */
    normalizeUri(uri) {
        if (!uri.includes('/embed')) {
            // we have a url like https://www.mp4upload.com/loje9jz4q4v1, convert it to an embed.
            const paths = urlRegex.exec(uri);
            if (paths) {
                // The .html suffix is required.
                return paths[1] + '/embed-' + paths[2] + '.html';
            }
        }
        return uri;
    }

    /** @inheritdoc */
    resolveHtml(meta, html, jar, headers) {
        let $ = cheerio.load(html);
        let script = $('#player script').get()[0].children[0].data;

        let jwPlayerConfig;
        let jQuery = this._getJqueryShim($);
        const sandbox = this._getDefaultSandbox(jQuery, this._getJwPlayerShim((config) => {
            jwPlayerConfig = config;
        }));
        vm.createContext(sandbox); // Contextify the sandbox.
        vm.runInContext(script, sandbox);

        let links = [];
        if(jwPlayerConfig && jwPlayerConfig.file) {
            links.push(jwPlayerConfig.file);
        }

        return this.processHtmlResults(meta, links);
    }
};