const rp = require('request-promise');
const cheerio = require('cheerio');

async function EnterVideo(uri, jar, headers) {
    const videoDowloadPageHtml = await rp({
        uri: uri,
        followAllRedirects: true,
        timeout: 5000
    });

    let $ = cheerio.load(videoDowloadPageHtml);

    const videoSourceUrl = $('source').attr('src') || '';

    if (videoSourceUrl.startsWith('http')) {
        return videoSourceUrl;
    }

    throw 'File not found';
}

module.exports = exports = EnterVideo;