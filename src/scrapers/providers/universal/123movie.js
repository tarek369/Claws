const Promise = require('bluebird');
const RequestPromise = require('request-promise');
const cheerio = require('cheerio');
const logger = require('../../../utils/logger');

const resolve = require('../../resolvers/resolve');

async function _123movie(req, sse){

    let queryTitle = req.query.title || req.query.name;
    let season = req.query.season;
    let episode = req.query.episode;

    const urls = ["https://123movie.gl"];
    const promises = [];

    const rp = RequestPromise.defaults(target => {
        if (sse.stopExecution) {
            return null;
        }

        return RequestPromise(target);
    });

    async function scrape(url) {
        const resolvePromises = [];

        try {
            const jar = rp.jar();
            // Fetch the HTML from the page
            let html = await rp({
                uri: `${url}?s=${queryTitle.replace(/ /g, '+')}`,
                timeout: 5000
            });

            let videoPage = '';

            // If it's a TV show, we need to append ": Season n"
            if(req.query.type === 'tv') queryTitle += `: Season ${season}`;

            // Find the link to the content
            let $ = cheerio.load(html);
            $("article.item").toArray().forEach(element => {
                let linkElement = $(element).find(".titlecover");

                let contentTitle = linkElement.text();
                let contentPage = linkElement.attr('href');

                if(contentTitle === queryTitle) videoPage = contentPage;
            });

            let videoPageHTML = await rp({
                uri: videoPage,
                timeout: 5000
            });

            $ = cheerio.load(videoPageHTML);

            let pageURL = '';

            // If it's a TV show, we have to click the episode number
            if(req.query.type === 'tv'){
                $(`.paginated-openload .episodios .mark .liopv`).each((index, element) => {
                    if($(element).text() === episode) {
                        pageURL = $(element).attr('onclick').split("'")[1];
                        return false;
                    }
                });
            }else{
                pageURL = $(`.liopv[onclick*="openload"]`).attr('onclick').split("'")[1];
            }

            // targetPageHTML is the HTML for the player page.
            let targetPageHTML = await rp({
                uri: pageURL,
                timeout: 5000,
                headers: {
                    'Referer': videoPage
                }
            });

            let outputPageURL = cheerio.load(targetPageHTML)('iframe').attr('src');

            let outputPageHTML = await rp({
                uri: outputPageURL,
                timeout: 5000,
                headers: {
                    'Referer': videoPage
                }
            });

            // This is the provider URL
            //let rapidVideoURL = cheerio.load(outputPageHTML)('link[rel="canonical"]').attr('href');
            let openloadVideoURL = cheerio.load(outputPageHTML)('meta[name="og:url"]').attr('content');
            resolvePromises.push(resolve(sse, openloadVideoURL, '123Movie', jar, {}));
        } catch (err) {
            if (!sse.stopExecution) {
                logger.error({source: '123Movies', sourceUrl: url, query: {title: queryTitle}, error: (err.message || err.toString()).substring(0, 100) + '...'});
            }
        }

        return Promise.all(resolvePromises);
    }

    urls.forEach((url) => {
        promises.push(scrape(url));
    });

    return Promise.all(promises);

}

module.exports = exports = _123movie;