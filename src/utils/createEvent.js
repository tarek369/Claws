const URL = require('url');

function createEvent(data, ipLocked, pairing, quality, provider, source, headers) {
	if (ipLocked && process.env.CLAWS_ENV === 'server') {
		// The scrape event is only sent when running in server mode.
		return {
		    event: 'scrape',
		    target: pairing.target,
		    headers,
		    resolver: `/api/v1/resolve/${provider}`
		}
	}

	return {
	    event: 'result',
	    file: {
	        data,
	        kind: getDataKind(data),
	    },
	    pairing,
	    metadata: {
	        quality,
	        provider,
	        source
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
