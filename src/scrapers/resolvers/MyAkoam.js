const randomUseragent = require('random-useragent');
const rp = require('request-promise');
const Utils = require('../../utils/index');

async function Akoam(uri, jar, headers) {
    let urlCookie = ''
    let shortUrl = await rp( {uri, jar, headers});
    let cookiesUrl = jar._jar.store.idx;
    for (var property in cookiesUrl) {
        console.log(property);
        if (!(property == 'akoam.net' || property == 'we.akoam.net')) {
            urlCookie = property;
        }
    }

    const cookieObjects = jar.getCookies('http://' + urlCookie);
    const cookieObject = cookieObjects ? cookieObjects.find(c => c.key === 'golink') : {};
    const cookieValue = cookieObject ? cookieObject.value : false;
    const cookie = decodeURIComponent(cookieValue);
    let items = RegExp('route":"(.*?)"').exec(cookie);
    let url = items[1].replace(new RegExp("\\\\/|/\\\\", "g"), "/");
    console.log(url);
    url = decodeURIComponent(url);

    const userAgent = randomUseragent.getRandom();
    const downloadlink = await rp({
        uri: url,
        method: 'POST',
        headers: {
            'user-agent': userAgent,
            'X-Requested-With': 'XMLHttpRequest',
            'Referer': url
        },
        jar,
        json: true
    });
    let file = downloadlink.direct_link;
    console.log(file);
    const quality = Utils.getQualityInfo(file);
    console.log(quality);
    return { resolvedLink: file , quality};

}
module.exports = exports = Akoam;
