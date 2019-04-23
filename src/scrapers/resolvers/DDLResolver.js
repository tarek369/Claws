const Utils = require('../../utils/index');

async function DDLResolver(uri, jar) {
    const filename = uri.split('/').pop();
    const quality = Utils.getQualityInfo(filename);
    return { resolvedLink: uri , quality};
}

module.exports = exports = DDLResolver;