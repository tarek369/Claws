'use strict';
const { queue } = require('../../utils/queue');

const providers = {
    standard: {
        anime: [
            new (require('./anime/AnimePahe'))(),
        ],
        movies: [
            new (require('./movies/Afdah'))(queue),
            new (require('./movies/AZMovies'))(queue),
            new (require('./movies/BFMovies'))(queue),
            new (require('./movies/DLFilm'))(queue),
            new (require('./movies/FilmXY'))(queue),
            new (require('./movies/LavinMovie'))(queue),
            new (require('./movies/MeliMedia'))(queue),
            new (require('./movies/OpenloadMovie'))(queue),
            new (require('./movies/Putlocker'))(queue),
            new (require('./movies/Reddit'))(queue),
            new (require('./movies/StreamM4U'))(queue)
        ],
        tv: [
            new (require('./tv/GrabTheBeast'))(queue),
            new (require('./tv/MoviesWeb'))(queue),
            new (require('./tv/ProjectFreeTV'))(queue),
            new (require('./tv/SeriesFree'))(queue),
            new (require('./tv/SwatchSeries'))(queue),
            new (require('./tv/ToonGet'))(queue)
        ],
        universal: [
            new (require('./universal/123Movie'))(queue),
            // new (require('./universal/DebugDummy'))(queue),
            new (require('./universal/FardaDL'))(queue),
            new (require('./universal/GoWatchSeries'))(queue),
            new (require('./universal/HeyDL'))(queue),
            new (require('./universal/ODB'))(queue),
            new (require('./universal/Onmovies'))(queue),
            new (require('./universal/PutlockerONL'))(queue),
            new (require('./universal/Series8'))(queue),
            new (require('./universal/Series9'))(queue),
            new (require('./universal/SockShare'))(queue),
            new (require('./universal/SolarMovie'))(queue)
        ]
    },
    rd: {
        movies: [
            new (require('./rd/movies/300MBDownload'))(queue),
            new (require('./rd/movies/300MBFilms'))(queue)
        ],
        tv: [
            new (require('./rd/tv/DirectDownloadTV'))(queue)
        ],
        universal: [
            new (require('./rd/universal/DDLSpot'))(queue),
            new (require('./rd/universal/MyVideoLinks'))(queue),
            new (require('./rd/universal/TwoDDL'))(queue)
        ]
    }
};

const providerList = {}
Object.keys(providers).forEach((providerType) => {
    Object.keys(providers[providerType]).forEach((type) => {
        if (!providerList[providerType]) {
            providerList[providerType] = [];
        }
        providers[providerType][type].forEach((provider) => {
            providerList[providerType].push(provider.getProviderId())
        })
    })
});

module.exports.providers = providers;
module.exports.providerList = providerList;