'use strict';

const providers =
	{
		movies: [
            require('./movies/123movie'),
			require('./movies/Afdah'),
            require('./movies/AZMovies'),
            require('./movies/bfmovies'),
			require('./movies/StreamM4u'),
			require('./movies/MovieFiles'),
		],
		tv: [
			require('./tv/GoWatchSeries'),
			require('./tv/SeriesFree'),
			require('./tv/AfdahTV'),
			require('./tv/Series8'),
			require('./tv/SwatchSeries'),
		],
		universal: []
	};

module.exports = exports = providers;
