const randomUseragent = require('random-useragent');
const rp = require('request-promise');
const Utils = require('../../utils/index');

async function Akoam(url, jar, headers) {

        const userAgent = randomUseragent.getRandom();
        const downloadlink = await rp({
            uri: url,
            method: 'POST',
            headers: {
                'user-agent': userAgent,
                'X-Requested-With': 'XMLHttpRequest',
                'Referer': url
            },
            jar,
            json: true
        });
        let file = downloadlink.direct_link;
        console.log(file);
        const quality = await Utils.getQualityInfo(file);
        return { resolvedLink: file , quality};



}
module.exports = exports = Akoam;
