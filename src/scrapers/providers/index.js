'use strict';
const { queue } = require('../../utils/queue');

module.exports.providers = {
    anime: [
        new (require('./anime/AnimePahe'))(),
    ],
    movies: [
        new (require('./movies/Afdah'))(queue),
        new (require('./movies/AZMovies'))(queue),
        new (require('./movies/BFMovies'))(queue),
        new (require('./movies/DLFilm'))(queue),
        new (require('./movies/MeliMedia'))(queue),
        new (require('./movies/StreamM4u'))(queue)
    ],
    tv: [
        new (require('./tv/ProjectFreeTV'))(queue),
        new (require('./tv/SeriesFree'))(queue),
        new (require('./tv/SwatchSeries'))(queue)
    ],
    universal: [
        new (require('./universal/123Movie'))(queue),
        new (require('./universal/FardaDownload'))(queue),
        new (require('./universal/GoWatchSeries'))(queue),
        new (require('./universal/ODB'))(queue),
        new (require('./universal/Onmovies'))(queue),
        new (require('./universal/Series8'))(queue),
        new (require('./universal/Series9'))(queue),
        new (require('./universal/SolarMovie'))(queue),
        new (require('./universal/SockShare'))(queue)
    ]
};

module.exports.queue = queue;