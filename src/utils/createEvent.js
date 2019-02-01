const URL = require('url');

function createEvent(data, ipLocked, pairing, {quality, provider, source, isDownload = false, isResultOfScrape = false, cookieRequired = '', cookie = ''}, headers) {
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
	        cookie
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
