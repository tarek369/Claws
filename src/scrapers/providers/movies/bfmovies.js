const Promise = require('bluebird');
const RequestPromise = require('request-promise');
const cheerio = require('cheerio');
const logger = require('../../../utils/logger')

const resolve = require('../../resolvers/resolve');

async function bfmovies(req, sse){
    const movieTitle = req.query.title;
    const year = req.query.year;

    const urls = ["https://bfmovies.net/"];
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
                uri: `${url}/search?q=${movieTitle.replace(/ /g, '+')}`,
                timeout: 5000
            });

            let videoPage = '';

            // Find the link to the content
            let $ = cheerio.load(html);
            $(`li[itemtype="http://schema.org/Movie"]`).toArray().forEach(element => {
                let linkElement = $(element).find("a");

                let contentTitle = $(element).find(`*[itemprop="name"]`).text();
                let contentPage = linkElement.attr('href');

                if (contentTitle === `${movieTitle} (${year})` || contentTitle === movieTitle) {
                    videoPage = contentPage;
                }
            });

            if (!videoPage) {
                return Promise.resolve();
            }

            let videoPageHTML = await rp({
                uri: videoPage,
                timeout: 5000
            });

            $ = cheerio.load(videoPageHTML);
            let openloadPage = $("iframe").attr('src');

            if(!openloadPage.includes("openload")){
                logger.debug("BFMovies does not always use OpenLoad.");
                return false;
            }

            let openloadHTML = await rp({
                uri: openloadPage,
                timeout: 5000
            });

            // This is the provider URL
            let openloadURL = cheerio.load(openloadHTML)('meta[name="og:url"]').attr('content');
            if (openloadURL) {
                resolvePromises.push(resolve(sse, openloadURL, 'BFMovies', jar, {}));
            } else {
                return Promise.resolve();
            }
        } catch (err) {
            if (!sse.stopExecution) {
                logger.error({source: 'BFMovies', sourceUrl: url, query: {title: req.query.title}, error: (err.message || err.toString()).substring(0, 100) + '...'});
            }
        }

        return Promise.all(resolvePromises);
    }

    urls.forEach((url) => {
        promises.push(scrape(url));
    });

    return Promise.all(promises);

}

module.exports = exports = bfmovies;