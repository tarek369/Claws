const Utils = require('../../utils/index');

async function DDLResolver(uri, quality) {
    const filename = uri.split('/').pop();
    if (!quality || quality == 'HQ') {
        quality = Utils.getQualityInfo(filename);
    }
    return { resolvedLink: uri , quality};
}

module.exports = exports = DDLResolver;
