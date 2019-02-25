const Promise = require('bluebird');
const RequestPromise = require('request-promise');
const cheerio = require('cheerio');
const logger = require('../../../utils/logger');

const resolve = require('../../resolvers/resolve');

async function _123movie(req, sse){

    let queryTitle = req.query.title;
    const {season, episode, year} = req.query;

    const urls = ["https://www6.123movie.cc"];
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
                uri: `${url}/search/?s=${queryTitle.replace(/ /g, '+')}`,
                timeout: 5000
            });

            let videoPage = '';

            // If it's a TV show, we need to append ": Season n"
            if(req.query.type === 'tv') queryTitle += `: Season ${season}`;

            // Find the link to the content
            let $ = cheerio.load(html);
            const formattedQueryTitle = queryTitle.toLowerCase().replace(/[^a-zA-Z0-9]+/g, '-');
            $("article.item").toArray().some(element => {
                let linkElement = $(element).find(".titlecover");
                let contentPage = linkElement.attr('href');

                if (req.query.type === 'tv') {
                    let contentTitle = linkElement.text();

                    if(contentTitle === queryTitle) {
                        videoPage = contentPage;
                        return true;
                    }
                } else {
                    if(contentPage === `${url}/movies/${formattedQueryTitle}-${year}/` || contentPage === `${url}/movies/${formattedQueryTitle}/`) {
                        videoPage = contentPage;
                        return true;
                    };
                }
                return false;
            });

            if (!videoPage) {
                return Promise.resolve();
            }

            let videoPageHTML = await rp({
                uri: videoPage,
                timeout: 5000
            });

            $ = cheerio.load(videoPageHTML);

            let pageURL = '';

            // If it's a TV show, we have to click the episode number
            if (req.query.type === 'tv'){
                // FIXME: I we need to grab all the links here intead of just a single openload link
                $(`.paginated-openload .episodios .mark .liopv`).each((index, element) => {
                    if($(element).text() === episode.toString()) {
                        pageURL = $(element).attr('onclick').split("'")[1];
                        return false;
                    }
                });
            } else {
                pageURL = $(`.liopv[onclick*="openload"]`).attr('onclick').split("'")[1];
            }

            if (!pageURL) {
                return Promise.resolve();
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