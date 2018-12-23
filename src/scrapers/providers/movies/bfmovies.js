const Promise = require('bluebird');
const RequestPromise = require('request-promise');
const cheerio = require('cheerio');

const resolve = require('../../resolvers/resolve');

async function bfmovies(req, sse){

    const movieTitle = req.query.title;

    const urls = ["https://bfmovies.net/"];
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

            if(contentTitle.includes(movieTitle)) videoPage = contentPage;
        });

        let videoPageHTML = await rp({
            uri: videoPage,
            timeout: 5000
        });

        $ = cheerio.load(videoPageHTML);
        let openloadPage = $("iframe").attr('src');

        if(!openloadPage.includes("openload")){
            console.log("BFMovies does not always use OpenLoad.");
            return false;
        }

        let openloadHTML = await rp({
            uri: openloadPage,
            timeout: 5000
        });

        // This is the provider URL
        let openloadURL = cheerio.load(openloadHTML)('meta[name="og:url"]').attr('content');
        console.log(openloadURL);

        const jar = rp.jar();
        return Promise.all([resolve(sse, openloadURL, 'BFMovies', jar, {})]);
    }

    urls.forEach((url) => {
        promises.push(scrape(url));
    });

    return Promise.all(promises);

}

module.exports = exports = bfmovies;