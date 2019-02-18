const rp = require('request-promise');
const cheerio = require('cheerio');

async function MovieFiles(uri, jar, headers) {
    const videoPageHtml = await rp({
        uri: 'https://moviefiles.org/getCookie.php',
        headers,
        jar,
        followAllRedirects: true,
        timeout: 5000
    });

    const videoDowloadPageHtml = await rp({
        uri: `${uri}&dl`,
        headers,
        jar,
        followAllRedirects: true,
        timeout: 5000
    });

    let $ = cheerio.load(videoDowloadPageHtml);

    const videoSourceUrl = $('#copyTarget').val() || '';

    if (videoSourceUrl.startsWith('http')) {
        return videoSourceUrl;
    }

    throw 'File not found';
}

module.exports = exports = MovieFiles;