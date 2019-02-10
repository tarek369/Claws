const URL = require('url');
//const inspector = require('url-inspector');
const ffprobe = require('ffprobe');
const ffprobeStatic = require('ffprobe-static');

async function createEvent(data, ipLocked, pairing, {quality, provider, source, isDownload = false, isResultOfScrape = false, cookieRequired = '', cookie = ''}, headers) {
	if (ipLocked) {
		return {
		    event: 'scrape',
		    target: pairing.target,
		    headers,
		    source,
		    resolver: provider,
		    cookieRequired
		}
	}

	let extended = {};
    try {
        extended = await ffprobe(data, { path: ffprobeStatic.path });
        extended.status = true;
    }catch(ex){
        let errorMessage = ex.toString();
        extended = {};
        extended.status = false;
        extended.statusText = errorMessage;
    }


    return {
        event: 'result',
        file: {
            data,
            kind: getDataKind(data),
        },
        isResultOfScrape,
        metadata: {
            quality,
            provider,
            source,
            isDownload,
            cookie,
            extended
        },
        headers
    };
}

function getDataKind(link) {
	const file = URL.parse(link).pathname;

	if (file.endsWith('.mp4')) {
		return 'video/mp4';
	} else if (file.endsWith('.m3u8')) {
		return 'application/x-mpegURL';
	} else if (file.endsWith('.mkv')) {
		return 'video/x-matroska';
	} else if (file.endsWith('==')) {
		return 'file';
	} else {
		return 'video/*';
	}
}

module.exports = exports = createEvent;
