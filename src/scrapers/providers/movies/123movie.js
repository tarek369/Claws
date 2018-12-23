const Promise = require('bluebird');
const RequestPromise = require('request-promise');
const cheerio = require('cheerio');

const resolve = require('../../resolvers/resolve');

async function _123movie(req, sse){

    const movieTitle = req.query.title;

    const urls = ["https://www.123movie.cc"];
    const promises = [];

    const rp = RequestPromise.defaults(target => {
        if (sse.stopExecution) {
            return null;
        }

        return RequestPromise(target);
    });

    async function scrape(url){
        // Fetch the HTML from the page
        let html = await rp({
            uri: `${url}?s=${movieTitle.replace(/ /g, '+')}`,
            timeout: 5000
        });

        let videoPage = '';

        // Find the link to the content
        let $ = cheerio.load(html);
        $("article.item").toArray().forEach(element => {
            let linkElement = $(element).find(".titlecover");

            let contentTitle = linkElement.text();
            let contentPage = linkElement.attr('href');

            if(contentTitle === movieTitle) videoPage = contentPage;
        });

        let videoPageHTML = await rp({
            uri: videoPage,
            timeout: 5000
        });

        $ = cheerio.load(videoPageHTML);
        let pageURL = $(`.liopv[onclick*="rapidvideo"]`).attr('onclick').split("'")[1];

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
        let rapidVideoURL = cheerio.load(outputPageHTML)('link[rel="canonical"]').attr('href');
        console.log(rapidVideoURL);

        const jar = rp.jar();
        return Promise.all([resolve(sse, rapidVideoURL, '123Movie', jar, {})]);
    }

    urls.forEach((url) => {
        promises.push(scrape(url));
    });

    return Promise.all(promises);

}

module.exports = exports = _123movie;