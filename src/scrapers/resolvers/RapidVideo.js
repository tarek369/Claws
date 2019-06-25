const rp = require('request-promise');
const cheerio = require('cheerio');
const {handleRequestError} = require('../../utils/errors');

async function RapidVideo(uri, jar) {
    try {
        let providerPageHtml = await rp({ uri, jar, timeout: 5000 });
        $ = cheerio.load(providerPageHtml);

        let videoLinks = $('div a div').toArray().reduce((returnArray, element) => {
            let qualitySpecificLink = $(element).parent().attr('href');
            returnArray.push(qualitySpecificLink);
            return returnArray;
        }, []);

        let resolvedData = [];
        for (let videoLink of videoLinks) {
            let splitComponents = videoLink.split('q=');
            let quality = splitComponents[splitComponents.length - 1];

            let videoPageHTML = await rp({ uri: videoLink, jar, timeout: 5000 });
            $ = cheerio.load(videoPageHTML)
            let resolvedLink = $('video source').attr('src');

            resolvedData.push({ resolvedLink, quality });
        }

        return resolvedData;
    } catch (err) {
        handleRequestError(err, false, "Resolver - RapidVideo");
    }
}

module.exports = exports = RapidVideo;