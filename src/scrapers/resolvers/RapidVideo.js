const rp = require('request-promise');
const cheerio = require('cheerio');
const logger = require('../../utils/logger');

async function RapidVideo(uri, jar) {
    try {
        let providerPageHtml = await rp({ uri, jar, timeout: 5000 });
        $ = cheerio.load(providerPageHtml);

        let videoLinks = $('div a div').toArray().reduce((returnArray, element) => {
            let qualitySpecificLink = $(element).parent().attr('href');
            returnArray.push(qualitySpecificLink);
            return returnArray;
        }, []);

        let resolvedLinks = [];
        for (let videoLink of videoLinks) {
            let videoPageHTML = await rp({ uri: videoLink, jar, timeout: 5000 });
            $ = cheerio.load(videoPageHTML)
            let resolvedLink = $('video source').attr('src');
            resolvedLinks.push(resolvedLink);
        }

        return resolvedLinks;
    } catch (err) {
        logger.error(err)
    }
}

module.exports = exports = RapidVideo;