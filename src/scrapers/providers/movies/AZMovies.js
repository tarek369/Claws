const cheerio = require('cheerio');
const randomUseragent = require('random-useragent');
const BaseProvider = require('../BaseProvider');
const tough = require('tough-cookie');

module.exports = class AZMovies extends BaseProvider {
    /** @inheritdoc */
    getUrls() {
        return ['https://azmovies.xyz'];
    }

    /** @inheritdoc */
    async scrape(url, req, ws) {
        const clientIp = this._getClientIp(req);
        const title = req.query.title.toLowerCase();
        const resolvePromises = [];
        let headers = {
            'user-agent': randomUseragent.getRandom(),
            'x-real-ip': clientIp,
            'x-forwarded-for': clientIp,
            'referer': url
        };
    
        try {
            const searchTitle = title.replace(/ /g, '+');
            let searchUrl = (`${url}/watch.php?title=${searchTitle}`);
            const rp = this._getRequest(req, ws);
            const jar = rp.jar();
            const response = await this._createRequest(rp, searchUrl, jar, headers);
            
            let documentCookie = /document\.cookie\s*=\s*"(.*)=(.*)";/g.exec(response);
            while (documentCookie) {
                const cookie = new tough.Cookie({
                    key: documentCookie[1],
                    value: documentCookie[2]
                });
                jar.setCookie(cookie, url);
                response = response.replace('document.cookie', '');
                documentCookie = /document\.cookie\s*=\s*"(.*)=(.*)";/g.exec(response);
            }

            const videoPageHtml = await this._createRequest(rp, searchUrl, jar, headers);

            let $ = cheerio.load(videoPageHtml);

            $('#serverul li a').toArray().forEach((element) => {
                const providerUrl = $(element).attr('href');
                resolvePromises.push(this.resolveLink(providerUrl, ws, jar, headers));
            });
        }
        catch (err) {
            this._onErrorOccurred(err)
        }
        return Promise.all(resolvePromises)
    }
}