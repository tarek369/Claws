'use strict';

let queue = null;
if (process.env.ENABLE_KUE) {
    const kue = require('kue');
    queue = kue.createQueue();
    kue.app.listen(3001);
}


module.exports.providers = {
    movies: [
        new (require('./movies/Afdah'))(queue),
        new (require('./movies/AZMovies'))(queue),
        new (require('./movies/bfmovies'))(queue),
        new (require('./movies/StreamM4u'))(queue),
        //require('./movies/MovieFiles'),
        new (require('./movies/DLFilm'))(queue)
    ],
    tv: [
        new (require('./tv/SeriesFree'))(queue),
        new (require('./tv/GoWatchSeries'))(queue),
        new (require('./tv/SwatchSeries'))(queue),
        //require('./tv/AfdahTV'),
    ],
    anime: [],
    universal: [
        new (require('./universal/123movie'))(queue),
        new (require('./universal/ODB'))(queue),
        new (require('./universal/Series8'))(queue),
        //require('./universal/5movies')
        new (require('./universal/FardaDownload'))(queue)
    ]
};

module.exports.queue = queue;